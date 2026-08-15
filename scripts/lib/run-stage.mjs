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
	// Space-separated timestamps ("2026-08-15 21:29:11"), which the ISO
	// pattern above misses because it requires a literal `T`.
	[/\b\d{4}-\d{2}-\d{2}[ ]\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g, '<timestamp>'],
	// 12-hour wall-clock times. Vite's dep-optimizer logger prefixes lines
	// with exactly this: "9:29:11 pm [vite] (client) Re-optimizing
	// dependencies because lockfile has changed" — fires reliably on a cold
	// cache, which is the normal state of a fresh CI checkout. Ordered before
	// the bare 24-hour pattern below so the am/pm suffix is consumed with it.
	[/\b\d{1,2}:\d{2}:\d{2}\s?(?:am|pm|AM|PM)\b/g, '<time>'],
	// 24-hour clock times not already covered above ("14:03:07").
	[/\b\d{2}:\d{2}:\d{2}\b/g, '<time>'],
	// Absolute paths on either platform
	[/[A-Za-z]:[\\/][^\s'"]+/g, '<path>'],
	[/\/(?:home|Users|tmp)\/[^\s'"]+/g, '<path>'],
	// Broader POSIX absolute path, not anchored to a fixed root list — the
	// list above misses a CI runner rooted at `/github/workspace`. Guarded by
	// a negative lookbehind so it does not fire on the `//` inside a URL
	// (`http://host/path` stays intact; a bare `/foo/bar` does not).
	[/(?<!\/)\/(?:[^\s'"/]+\/)+[^\s'"/]+/g, '<path>']
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
