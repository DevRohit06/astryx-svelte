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

// Well clear of the slowest legitimate stage (`pnpm -r test` with the browser
// suite) and well under GitHub's six-hour job cap, so a stuck stage fails with
// its own name attached instead of taking the whole job down anonymously.
const DEFAULT_TIMEOUT = 30 * 60 * 1000;

const NONDETERMINISM = [
	// Durations, but only in timing context: a preceding keyword a test runner
	// or bundler actually uses ("Duration 4.53s", "done in 1.2s", "built in
	// 76s", "completed in 900ms"), or a bracketed/parenthesised position
	// ("(456ms)", "[12.3s]"). A bare number-plus-unit is not enough — that
	// also matches inside `transition-duration: 200ms, 0.5s;` and
	// `animation: 0.3s ease`, which is exactly what the class and CSS oracles
	// print, and stripping it there destroys the diagnostic value of the
	// captured output. The leading `\b` alone does not stop the bare `in`
	// alternative from matching inside `ease-in 1s infinite` — a hyphen is a
	// non-word character, so a word boundary exists right after it too. The
	// `(?<!-)` lookbehind is what actually excludes a hyphen-preceded `in`.
	[
		/(?<!-)\b(?:in|took|after|elapsed|completed in|finished in|Duration)\s+\d+(?:\.\d+)?\s?m?s\b/gi,
		(m) => m.replace(/\d+(?:\.\d+)?\s?m?s$/, '<duration>')
	],
	[/[([]\s*\d+(?:\.\d+)?\s?m?s\s*[)\]]/g, (m) => m[0] + '<duration>' + m[m.length - 1]],
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
	// Absolute paths on either platform. Unanchored, `[A-Za-z]:[\\/]` matches
	// the last letter of any URI scheme too — `https://…`, `http://…` and
	// `file:///D:/…` all have a letter immediately before `://`, so the old
	// pattern ate into the scheme itself (`fil<path>`, `htt<path>`). The
	// `(?<![A-Za-z])` lookbehind requires the drive letter to start a token —
	// every scheme letter is preceded by another letter, a real drive letter
	// is not. The trailing class also stopped at a closing paren or quote, so
	// `url(D:\repo\icon.svg) no-repeat` no longer loses the `)`.
	[/(?<![A-Za-z])[A-Za-z]:[\\/][^\s'")]+/g, '<path>'],
	// POSIX absolute paths, enumerated by known filesystem root rather than
	// matched by shape. A previous version of this pattern matched *any*
	// absolute path (`/(?:[^\s'"/]+\/)+[^\s'"/]+`), which also fires inside
	// CSS `url(...)` values and package-scoped import specifiers — both of
	// which are exactly what the class and CSS oracles print:
	//   url(/static/icon.svg) no-repeat;   ->  url(<path> no-repeat;
	//   "@astryxdesign/core/Button"        ->  "@astryxdesign<path>"
	// `/static/` and `/core/` are not filesystem roots, so an enumerated list
	// cannot match them — only a real root can. Extend this list rather than
	// widening the shape if a new CI provider needs a root added.
	[
		/\/(?:home|Users|tmp|root|var\/folders|github\/workspace|runner|builds|workspace)\/[^\s'"]+/g,
		'<path>'
	]
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
		maxBuffer: 64 * 1024 * 1024,
		// **`stdin` must be closed, not piped.** Without this, `spawnSync`
		// defaults every stream to a pipe, and a child that reads stdin blocks
		// on a pipe nothing will ever write to. On Windows `shell: true` hides
		// it; on Linux it does not. CI's first real run of this gate hung for
		// six hours in `pnpm verify --no-client` and printed nothing at all
		// before the runner killed it at its cap.
		stdio: ['ignore', 'pipe', 'pipe'],
		// A hang should cost minutes, not a whole CI budget. The slowest
		// legitimate stage is `pnpm -r test` with the browser suite; 30 minutes
		// is well clear of it and well under GitHub's six-hour job cap, so a
		// stuck stage fails with its own name attached instead of taking the
		// job down anonymously.
		timeout: opts.timeout ?? DEFAULT_TIMEOUT,
		killSignal: 'SIGKILL'
	});
	// `result.error` is set when `spawnSync` itself couldn't run the command
	// (e.g. the binary is missing) — stdout/stderr are then null, so silently
	// dropping it reports `FAIL (exit 1)` with an empty output block and no
	// clue why. Node sets `status` to null in that case too, and the `?? 1`
	// below already covers that; this just makes the reason visible.
	const timedOut = result.error?.code === 'ETIMEDOUT';
	const limit = opts.timeout ?? DEFAULT_TIMEOUT;
	const limitText =
		limit < 60_000 ? `${Math.round(limit / 1000)}s` : `${Math.round(limit / 60_000)}m`;
	const errorLine = timedOut
		? `stage timed out after ${limitText} and was killed — it produced the output below ` +
			`before hanging\n`
		: result.error
			? `${result.error.message}\n`
			: '';
	// Strip the *child's* output only. `errorLine` is ours, and running it
	// through the filter lets the duration pattern eat the very number the
	// timeout message exists to report ("after 3s" -> "after <duration>").
	const captured = stripNondeterminism(`${result.stdout ?? ''}${result.stderr ?? ''}`);
	const output = `${errorLine}${captured}`;
	return { name, ok: result.status === 0, code: result.status ?? 1, output };
}

export function lastLine(text) {
	const lines = text.split('\n').filter((l) => l.trim() !== '');
	return lines[lines.length - 1] ?? '';
}
