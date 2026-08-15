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

import { execFileSync } from 'node:child_process';
import { runStage } from './lib/run-stage.mjs';

const fast = process.argv.includes('--fast');

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

const stages = [
	runStage('build', 'pnpm', ['-r', 'build']),
	runStage('check', 'pnpm', ['-r', 'check']),
	runStage('lint', 'pnpm', ['-r', 'lint']),
	// `pnpm -r lint` runs prettier inside each package, so the repo root and
	// `port/*.md` were never checked — cheap to run, so it stays in both modes.
	runStage('lint:root', 'pnpm', ['lint:root'])
];
if (!fast) stages.push(runStage('test', 'pnpm', ['-r', 'test']));
stages.push(
	runStage('status', 'node', fast ? ['scripts/status.mjs'] : ['scripts/status.mjs', '--full'])
);

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

console.log(
	`\nall ${stages.length} stages passed.` +
		(fast ? ' (fast mode — test suite and full-tier gates skipped)' : '')
);
