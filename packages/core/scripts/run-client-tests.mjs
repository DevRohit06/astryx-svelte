/**
 * @file run-client-tests.mjs
 *
 * Runs the **client** vitest project in chunks, and reconciles what ran against
 * what is on disk.
 *
 * One `vitest --run --project=client` over all 162 files does not survive. It
 * dies partway through with
 * `TypeError: Cannot read properties of undefined (reading 'wrapDynamicImport')`
 * — Vite's module runner, not a test assertion — and every file after that point
 * is reported as failed or never runs at all. The crash point moves: 82 files in
 * on an Ubuntu CI runner, 149–163 locally, and a different file each time. It is
 * the shared browser session ageing out, not a bug in whichever suite was
 * unlucky, which is why `fileParallelism: false` (see `vite.config.ts`, where
 * serialisation retired a *different* flake family) does not help — that made
 * the files take turns; this is about how long one session lives.
 *
 * So the suite runs in batches, each in a fresh process with a fresh browser.
 * **This is a workaround with a stated cost**, not a fix: cross-file state
 * leakage between chunk boundaries is no longer exercised, and a chunk pays
 * ~15 s of browser and Vite start-up. The thing to restore is a single run;
 * until then a chunked pass is the only measurement of this project that means
 * anything, and it is what CI, the release gate and `pnpm -F …/core test` all
 * use.
 *
 * **The reconciliation is the point.** A tally summed from per-chunk logs is
 * only as complete as the loop that wrote it — a chunk that never ran subtracts
 * from the total silently and still exits 0. So this counts the files vitest
 * says it ran and fails if that does not equal the files on disk, which is the
 * check that makes "5,066 passed" a claim rather than an impression.
 *
 * @input  packages/core/src/tests/*.svelte.test.ts
 * @output exit 0 with a reconciled total, or exit 1 naming the failing chunk
 * @position `pnpm -F @astryx-svelte/core test`; CI and .github/workflows/release.yml
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { isInfrastructureFailure } from './lib/classify-chunk-failure.mjs';

const CORE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTS = path.join(CORE, 'src', 'tests');

/**
 * Files per chunk. 20 was not enough margin: one CI run passed every chunk and
 * the next lost chunk 5 at 13 of 20 files, on the same commit. 12 is the size
 * the local 14-chunk pass has always cleared. Raising it trades margin for wall
 * clock; lowering it pays another browser launch. `CLIENT_CHUNK_SIZE` overrides
 * it for bisecting a crash.
 */
const SIZE = Number(process.env.CLIENT_CHUNK_SIZE ?? 12);

/**
 * How many times a chunk that lost its browser is re-run. Only ever applied to
 * an infrastructure failure — a chunk that failed a *case* stops immediately,
 * however many attempts are left.
 *
 * One was not enough. On release run 31407711720, chunk 2 dropped on both
 * attempts, ~40 seconds apart, with a different innocent victim each time
 * (`carousel-handle-untracked`, then `center`) and the identical cause both
 * times: `Failed to import test file setup-stylex.ts`, zero failed tests. Two
 * consecutive drops is a runner having a bad minute, not a suite that cannot
 * pass — the same 12 files passed on the run before and the run after.
 */
const RETRIES = Number(process.env.CLIENT_CHUNK_RETRIES ?? 2);

/**
 * How many chunks run at once.
 *
 * Chunks were already independent by construction — each is a fresh process
 * with its own browser, its own Vite server and (since the collision described
 * on `runChunk`) its own optimizer cache — so running several at a time needs no
 * isolation work.
 *
 * **The cap is 2, and it used to be 4.** The old number was chosen when every
 * chunk shared one optimizer cache, so only the first paid to build it. Isolating
 * the caches removed a collision that stalled three of four chunks into the
 * stage's 30-minute timeout, but it moved that cost onto every chunk: four
 * concurrent full dependency optimizations starve this box, and a starved chunk
 * does not crash — `userEvent.click` lands on a page that is not answering yet,
 * handlers never fire, and a dozen unrelated cases report as assertion failures.
 * Measured at the 042 close, twice each: at 4, chunk 3 fails reproducibly with
 * checkbox and chat clicks that never arrive, and all of its files pass in
 * isolation; at 2, 18/18 chunks and 5,499 cases pass.
 *
 * That measurement is from **one machine**, so the number is conservative rather
 * than derived. `CLIENT_CHUNK_CONCURRENCY` raises it where there is headroom —
 * the binding constraint is memory, not cores: a chunk is a headless Chromium, a
 * Vite dev server and now an optimizer, and the smallest GitHub Codespace is
 * 2 cores / 4 GB (GitHub's own docs said 8 GB until github/docs#28019 corrected
 * it, so 8 is the number to distrust here).
 *
 * **The isolated cache is a memory trade and it has been seen to lose.** Each
 * chunk now holds its own dependency graph where they used to share one, and a
 * `pnpm verify` on an already-loaded box died with `memory allocation of 34816
 * bytes failed` and a `0xC0000409` chunk crash, having passed 18/18 standalone
 * on the same commit minutes earlier. That is the shape to watch for on a small
 * runner: not assertion failures but a chunk vanishing, browsers dropping, and
 * retries that do not help. If CI shows it, `CLIENT_CHUNK_CONCURRENCY=1` is the
 * lever, and sharing the cache again — accepting the rename collision — is the
 * fallback.
 *
 * `CLIENT_CHUNK_CONCURRENCY=1` restores strictly-serial behaviour, which is what
 * to reach for when bisecting a crash — interleaved output makes that harder, and
 * serial output is streamed live where concurrent output is buffered per chunk.
 */
const CONCURRENCY = Number(
	process.env.CLIENT_CHUNK_CONCURRENCY ?? Math.max(1, Math.min(2, os.cpus().length - 1))
);

/**
 * Vitest's entry resolved as a JS file and run through `process.execPath`,
 * rather than the `.bin` shim. Since the CVE-2024-27980 fix Node refuses to
 * spawn a `.cmd` without a shell, so the shim needs `shell: true` on Windows,
 * and an args array through a shell is concatenated rather than escaped.
 */
const require = createRequire(import.meta.url);
const vitestPkg = require.resolve('vitest/package.json');
const vitestBin = path.join(path.dirname(vitestPkg), require('vitest/package.json').bin.vitest);

const files = fs
	.readdirSync(TESTS)
	.filter((name) => name.endsWith('.svelte.test.ts'))
	.sort()
	.map((name) => `src/tests/${name}`);

if (files.length === 0) {
	// Loudly, not silently — the same rule both fidelity oracles follow. An empty
	// file list is indistinguishable from a passing run everywhere downstream.
	console.error(`No *.svelte.test.ts files under ${TESTS}. The test layout has moved.`);
	process.exit(1);
}

const chunks = [];
for (let i = 0; i < files.length; i += SIZE) chunks.push(files.slice(i, i + SIZE));

console.log(`  client suite: ${files.length} files in ${chunks.length} chunks of up to ${SIZE}\n`);

let ranFiles = 0;
let ranCases = 0;
const failed = [];
/** Chunks that lost their browser and were re-run. Reported, never silent. */
const retried = [];

/**
 * Output is streamed **and** captured: streamed because a captured 25-minute
 * step with no output is indistinguishable from a hung one in a CI log, and
 * captured because the per-chunk counts are read back out of it.
 *
 * The counts come from the printed summary rather than from `--reporter=json`,
 * which cannot supply them: measured on a two-file chunk, the JSON report put
 * all 42 cases under a **single** `testResults` entry naming one of the two
 * files, so `testResults.length` is not a file count and the reconciliation
 * below — the entire reason this script exists — would have compared 1 against
 * 2 and failed a passing run. A regex over pretty output is the fragile-looking
 * option and is the correct one here, because it fails *loudly*: a summary that
 * stops matching makes the chunk count as failed rather than as zero.
 *
 * Streaming is conditional on running serially. Interleaving several chunks'
 * live output would produce a log no one can read and, worse, one where a
 * failure cannot be attributed to a chunk — so concurrent runs capture only and
 * the caller prints each chunk's output as one block when it finishes. That
 * still keeps a CI log alive: a block lands every time a chunk completes, which
 * is the property the streaming was there for.
 *
 * Each chunk gets its **own** Vite optimizer cache. Vitest's browser mode
 * re-optimizes on every run, so the shared `node_modules/.vite` buys nothing and
 * costs a collision: several chunks write `.vite-temp` and rename it into place
 * at once, which is the `EPERM: rename` failure CLAUDE.md documents for two
 * hand-started vitest processes. Isolating it costs disk and no CPU. See
 * `vite.config.ts`, which reads the variable.
 *
 * @param {string[]} args
 * @param {boolean} stream
 * @param {number} index
 * @returns {Promise<{code: number | null, output: string}>}
 */
function runChunk(args, stream, index) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, args, {
			cwd: CORE,
			env: {
				...process.env,
				CLIENT_CHUNK_CACHE_DIR: path.join(CORE, 'node_modules', `.vite-chunk-${index}`)
			}
		});
		let output = '';
		child.stdout.on('data', (data) => {
			output += data;
			if (stream) process.stdout.write(data);
		});
		child.stderr.on('data', (data) => {
			output += data;
			if (stream) process.stderr.write(data);
		});
		child.on('close', (code) => resolve({ code, output }));
	});
}

/**
 * Vitest colours its summary when stdout is a TTY; a pipe is not, so stripping
 * is belt and braces. Built with `String.fromCharCode(27)` rather than written
 * as a regex literal because eslint's `no-control-regex` rejects a raw ESC
 * inside one — and the rule is right that a control character no reader can see
 * is a poor thing to leave in source.
 */
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const stripAnsi = (text) => text.replace(ANSI, '');

const serial = CONCURRENCY <= 1;

/**
 * Run one chunk to a verdict, retries included. Returns rather than mutating
 * the tallies, so the caller can fold results in **chunk order** however they
 * finished — a concurrent run completes out of order, and a failure list whose
 * order changes between runs is a worse log than a slower one.
 *
 * @param {number} index
 * @param {string[]} chunk
 */
async function settleChunk(index, chunk) {
	const label = `chunk ${index + 1}/${chunks.length}`;
	const args = [vitestBin, '--run', '--project=client', ...chunk, ...process.argv.slice(2)];
	/** @type {string[]} */
	const retries = [];
	let banner = `\n──────── ${label} ────────\n`;

	if (serial) process.stdout.write(banner);

	let code, plain, fileLine, caseLine, output;

	for (let attempt = 0; attempt <= RETRIES; attempt++) {
		if (attempt > 0) {
			const note = `\n  ${label} lost its browser, not a case — retry ${attempt} of ${RETRIES}.\n\n`;
			if (serial) process.stdout.write(note);
			else banner += note;
			retries.push(`${label} (×${attempt})`);
		}

		const result = await runChunk(args, serial, index);
		code = result.code;
		output = result.output;
		plain = stripAnsi(result.output);
		fileLine = plain.match(/Test Files\s+(\d+) passed\s+\((\d+)\)/);
		caseLine = plain.match(/Tests\s+(\d+) passed\s+\((\d+)\)/);

		const ok = code === 0 && fileLine && caseLine;
		// Stop on success, and stop immediately on a *real* failure — a chunk
		// that failed a case is never re-run, however many attempts are left.
		if (ok || !isInfrastructureFailure(plain)) break;
	}

	const ok = code === 0 && fileLine && caseLine;
	const verdict = ok
		? `  ${label} ok — ${fileLine[1]} files, ${caseLine[1]} cases\n`
		: `  ${label} FAILED (exit ${code})\n`;

	// Concurrent: the whole chunk lands as one block now that it is finished, so
	// its output is contiguous and attributable. Serial already streamed it.
	process.stdout.write(serial ? verdict : banner + output + verdict);

	return {
		label,
		chunk,
		code,
		ok,
		retries,
		files: ok ? Number(fileLine[1]) : 0,
		cases: ok ? Number(caseLine[1]) : 0
	};
}

/**
 * A fixed pool of `CONCURRENCY` workers pulling from a shared cursor, rather
 * than `Promise.all` over slices: chunks do not take equal time (a chunk of
 * heavy suites can run twice as long as a light one), and slicing would leave
 * workers idle waiting for the slowest slice to drain.
 */
const results = new Array(chunks.length);
let cursor = 0;

async function worker() {
	for (;;) {
		const index = cursor++;
		if (index >= chunks.length) return;
		results[index] = await settleChunk(index, chunks[index]);
	}
}

console.log(
	serial
		? '  running chunks serially (CLIENT_CHUNK_CONCURRENCY=1)\n'
		: `  running up to ${CONCURRENCY} chunks at a time on ${os.cpus().length} core(s)` +
				', each with its own optimizer cache\n'
);

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));

for (const result of results) {
	if (result.ok) {
		ranFiles += result.files;
		ranCases += result.cases;
	} else {
		failed.push({ label: result.label, chunk: result.chunk, code: result.code });
	}
	retried.push(...result.retries);
}

if (failed.length > 0) {
	console.error('');
	for (const { label, chunk, code } of failed) {
		console.error(`  ${label} exited ${code}, over:`);
		for (const file of chunk) console.error(`      ${file}`);
	}
	console.error(
		`\n  ${failed.length} of ${chunks.length} chunk(s) failed. Their output is above,\n` +
			`  in place — re-run one with:\n` +
			`      pnpm -F @astryx-svelte/core exec vitest --run --project=client <file>`
	);
	process.exit(1);
}

if (ranFiles !== files.length) {
	console.error(
		`\n  Reconciliation failed: ${ranFiles} file(s) ran, ${files.length} on disk.\n` +
			`  Every chunk exited 0, so this is a chunk that collected nothing — the\n` +
			`  case a summed total cannot see.`
	);
	process.exit(1);
}

console.log(`\n  client: ${ranFiles}/${files.length} files, ${ranCases} cases passed, 0 failed`);

// Never a silent retry. A green run that needed one is a different fact from a
// green run that did not, and the frequency is the measurement that says
// whether the chunk size is still right.
if (retried.length > 0) {
	console.log(`  ${retried.length} chunk(s) lost a browser and were re-run: ${retried.join(', ')}`);
}
