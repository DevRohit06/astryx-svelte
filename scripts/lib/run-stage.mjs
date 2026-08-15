// Shared child-process runner for `status.mjs` and `verify.mjs`.
//
// Two rules encoded here, both of which this repo has already paid for:
//
//   - A stage never throws. `pnpm -r lint` used to be chained with `&&`, which
//     reports "failed" identically whether one stage failed or both ran — a
//     stray scratch file short-circuited eslint and hid six real errors for
//     several batches. Callers collect every result and report all of them.
//   - Captured output is stripped of anything clock-dependent before it can
//     reach `port/status.md`. A timestamp there would make the diff gate fail
//     on every run, which is the same as having no gate.

import { spawnSync } from 'node:child_process';

const NONDETERMINISM = [
	// Durations: "1.23s", "456ms", "in 2 m", "(1.2 s)"
	[/\b\d+(?:\.\d+)?\s?m?s\b/g, '<duration>'],
	// ISO timestamps
	[/\b\d{4}-\d{2}-\d{2}T[\d:.]+Z?\b/g, '<timestamp>'],
	// Absolute paths on either platform
	[/[A-Za-z]:[\\/][^\s'"]+/g, '<path>'],
	[/\/(?:home|Users|tmp)\/[^\s'"]+/g, '<path>']
];

export function stripNondeterminism(text) {
	let out = text;
	for (const [pattern, replacement] of NONDETERMINISM) out = out.replace(pattern, replacement);
	// Normalise line endings so a Windows run and a CI run agree byte for byte.
	return out.replace(/\r\n/g, '\n').trimEnd();
}

export function runStage(name, command, args, opts = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		shell: process.platform === 'win32',
		cwd: opts.cwd ?? process.cwd(),
		maxBuffer: 64 * 1024 * 1024
	});
	const output = stripNondeterminism(`${result.stdout ?? ''}${result.stderr ?? ''}`);
	return { name, ok: result.status === 0, code: result.status ?? 1, output };
}

export function lastLine(text) {
	const lines = text.split('\n').filter((l) => l.trim() !== '');
	return lines[lines.length - 1] ?? '';
}
