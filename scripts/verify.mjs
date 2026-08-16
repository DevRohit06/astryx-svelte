#!/usr/bin/env node
// The gate. Runs every stage, reports all of them, and fails if the committed
// `port/status.md` disagrees with what the tree actually produces.
//
// Its shape is dictated by two failures this repo already paid for:
//
//   - `prettier --check . && eslint .` reports "failed" identically whether one
//     stage failed or both ran. A stray scratch file short-circuited eslint and
//     hid six real errors for several batches. So: no `&&`. Every stage runs,
//     every result is printed, the exit code is the OR of the failures.
//   - "The gate is only as trustworthy as the tree is quiet" — a scratch file
//     deleted between eslint's enumeration and its read failed the run on a
//     path that no longer existed. So the tree is checked before anything runs.
//
// `--fast` skips `pnpm -r test` (the browser suite alone is ~4,500 cases in
// real Chromium) and runs `status.mjs` in its default, non-`--full` tier
// instead. It exists so a developer can gate a commit locally without paying
// for what CI pays for. It is not a substitute for the full gate — the
// summary line says so explicitly, so a passing `--fast` run can never be
// mistaken for a passing full one.
//
// `--no-client` skips only core's browser suite (`test:client`) while still
// running its server project, both fidelity oracles, every other package's
// tests, and the full-tier status generation. Unlike `--fast`, this *is* a
// legitimate stand-in for the unflagged run when something else is covering
// the browser suite: CI's `lib` job runs `pnpm verify --no-client` in
// parallel with a `client` job that runs nothing but the browser suite (see
// ci.yml), so the two jobs together do exactly what an unflagged `pnpm
// verify` does, just concurrently instead of serially.

import { execFileSync } from 'node:child_process';
import { runStage } from './lib/run-stage.mjs';

const fast = process.argv.includes('--fast');
const noClient = process.argv.includes('--no-client');
const noDocs = process.argv.includes('--no-docs');

// Scratch patterns. `zz-` is this repo's own convention for a throwaway.
const SCRATCH = /(^|[\\/])(zz-|.*\.scratch\.)/;

function scratchFiles() {
	const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n');
	const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
		encoding: 'utf8'
	}).split('\n');
	return [...tracked, ...untracked].filter((f) => f && SCRATCH.test(f));
}

const scratch = scratchFiles();
if (scratch.length > 0) {
	console.error('verify refuses to run: scratch files in the tree\n');
	for (const f of scratch) console.error(`  ${f}`);
	console.error('\nA batch that leaves these behind has not finished. Remove or rename them.');
	process.exit(1);
}

// `--no-docs` is the sibling of `--no-client`: the `docs` CI job already runs
// docs' own build, check, lint and test in parallel, so routing them through
// here too made the `lib` job redo an entire other job's work sequentially.
// Locally, with no sibling job to lean on, `pnpm verify` still covers docs.
const docsFilter = noDocs ? ['--filter=!docs'] : [];

const stages = [
	runStage('build', 'pnpm', ['-r', ...docsFilter, 'build']),
	runStage('check', 'pnpm', ['-r', ...docsFilter, 'check']),
	runStage('lint', 'pnpm', ['-r', ...docsFilter, 'lint']),
	// `pnpm -r lint` runs prettier inside each package, so the repo root and
	// `port/*.md` were never checked — cheap to run, so it stays in both modes.
	runStage('lint:root', 'pnpm', ['lint:root'])
];
if (!fast) {
	if (noClient) {
		// Everything `pnpm -r test` runs except core's `test:client` — that
		// piece runs in the sibling `client` CI job instead. `test:node` is
		// core's server project plus both fidelity oracles; the second stage
		// is every other workspace package's own `test` script.
		stages.push(
			runStage('test:node', 'pnpm', ['-F', '@astryx-svelte/core', 'test:node']),
			runStage('test:rest', 'pnpm', ['-r', '--filter=!@astryx-svelte/core', ...docsFilter, 'test'])
		);
	} else {
		stages.push(runStage('test', 'pnpm', ['-r', 'test']));
	}
}
// Always the fast tier, at every mode. `--full` runs the class oracle, the CSS
// oracle, eight theme suites, `vitest list` and the docs generator — and since
// the gate results were moved out of the committed file, it produces a
// **byte-identical** `port/status.md`. Every one of those five is already run
// by the test stages above, so calling it here was the same work twice for a
// file that does not change. `node scripts/status.mjs --full` is still there
// when you want the gate log; the drift gate does not need it.
stages.push(runStage('status', 'node', ['scripts/status.mjs']));

// The drift gate. `status.mjs` has just rewritten the file; if that changed
// anything, a committed claim no longer matches the tree.
stages.push(runStage('status drift', 'git', ['diff', '--exit-code', '--', 'port/status.md']));

console.log('\n=== verify ===\n');
for (const s of stages) {
	console.log(`${s.ok ? 'pass' : 'FAIL'}  ${s.name}${s.ok ? '' : ` (exit ${s.code})`}`);
}

const failed = stages.filter((s) => !s.ok);
if (failed.length > 0) {
	for (const s of failed) {
		console.error(`\n--- ${s.name} (exit ${s.code}) ---\n${s.output}`);
	}
	console.error(`\n${failed.length} of ${stages.length} stages failed.`);
	if (failed.some((s) => s.name === 'status drift')) {
		console.error('\nport/status.md is stale. Commit the regenerated file.');
	}
	process.exit(1);
}

// Name every narrowing in the summary, so a passing run can never be mistaken
// for a wider one than it was.
const skipped = [
	fast && 'the test suite',
	noClient && "core's browser suite",
	noDocs && 'docs'
].filter(Boolean);

console.log(
	`\nall ${stages.length} stages passed.` +
		(skipped.length ? ` (skipped: ${skipped.join(', ')} — expected to run elsewhere)` : '')
);
