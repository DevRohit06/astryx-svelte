#!/usr/bin/env node
// Generates `port/status.md`. Every countable claim about this port is derived
// here rather than typed, because the typed ones drifted: "100 / 100" survived
// three batches after upstream moved to 101, and the file it lived in ended up
// instructing readers not to trust its own numbers.
//
// Two design rules:
//   - Capture, do not parse. Each gate's own stdout is embedded verbatim with
//     its exit code. Regexing a number out of prose is the fragility this
//     script exists to remove.
//   - Deterministic output only. No clock, no paths, no SHAs — `verify.mjs`
//     gates on `git diff --exit-code port/status.md`, so a timestamp would
//     fail every run.
//
// Usage: node scripts/status.mjs [--full]
//   default  filesystem counts, manifest pins and debt tallies. Seconds.
//   --full   additionally runs the oracles, `vitest list` and the docs
//            generator, and embeds their output. Minutes.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { runStage, lastLine } from './lib/run-stage.mjs';

const full = process.argv.includes('--full');
const root = process.cwd();

const dirs = (p) =>
	existsSync(p)
		? readdirSync(p, { withFileTypes: true })
				.filter((e) => e.isDirectory())
				.map((e) => e.name)
				.sort()
		: [];

// --- Components, bidirectionally -------------------------------------------

const ours = dirs(path.join(root, 'packages/core/src/lib/components'));

// Upstream has no `src/components` subdirectory — each component lives
// directly under `packages/core/src/<ComponentName>/`, alongside
// non-component directories (`__tests__`, `hooks`, `i18n`, `theme`, `utils`).
// Every real component directory upstream is PascalCase, so that is the
// filter for excluding the rest — it survives a new non-component directory
// being added later, where a hardcoded denylist would not.
const upstreamRoot = path.join(root, 'reference/astryx-upstream/packages/core/src');
const theirs = dirs(upstreamRoot).filter((d) => /^[A-Z]/.test(d));
const upstreamPresent = theirs.length > 0;

// Comparing directory names directly fails on naming convention alone —
// upstream is PascalCase (`AlertDialog`), this port is kebab-case
// (`alert-dialog`). Compare on a case/dash-insensitive canonical form, but
// keep the original names for the printed lists.
const canon = (s) => s.toLowerCase().replace(/-/g, '');
const oursCanon = new Set(ours.map(canon));
const theirsCanon = new Set(theirs.map(canon));

// Upstream directories this port deliberately folds into another module
// rather than giving each one a same-named directory under components/. All
// four are still exported from packages/core/src/lib/index.ts — see
// CLAUDE.md and port/debts.md.
//   - HStack, VStack fold into the `stack` component directory (alongside
//     `Stack` itself, which already matches by canonical name with no help
//     needed).
//   - SizeContext, InteractiveRoleContext are context objects, not visual
//     components. Neither lives under components/, so there is no same-named
//     directory to fold into — checked directly against the file that exports
//     each one (SizeContext from internal/, InteractiveRoleContext from
//     lib/ directly — see packages/core/src/lib/index.ts).
const FOLDED_INTO_DIR = { HStack: 'stack', VStack: 'stack' };
const FOLDED_FILES = {
	SizeContext: 'internal/contexts.svelte.ts',
	InteractiveRoleContext: 'interactive-role-context.svelte.ts'
};

const isFolded = (name) => {
	if (FOLDED_INTO_DIR[name]) return ours.includes(FOLDED_INTO_DIR[name]);
	if (FOLDED_FILES[name]) {
		return existsSync(path.join(root, 'packages/core/src/lib', FOLDED_FILES[name]));
	}
	return false;
};

// A folded entry whose target does not actually exist is a real gap, not a
// false positive to suppress — `isFolded` returns false for it and it falls
// through to `missing` below.
const missing = theirs.filter((t) => !oursCanon.has(canon(t)) && !isFolded(t));
const invented = ours.filter((o) => !theirsCanon.has(canon(o)));

// --- Themes ----------------------------------------------------------------

// A directory under packages/themes counts as a theme package only if it has
// its own manifest declaring an `@astryx-svelte/theme-*` name — `shared` is
// utilities consumed by the theme scripts, not a package of its own.
const themes = dirs(path.join(root, 'packages/themes')).filter((name) => {
	const manifest = path.join(root, 'packages/themes', name, 'package.json');
	if (!existsSync(manifest)) return false;
	let pkg;
	try {
		pkg = JSON.parse(readFileSync(manifest, 'utf8'));
	} catch {
		return false;
	}
	return typeof pkg.name === 'string' && pkg.name.startsWith('@astryx-svelte/theme-');
});

// --- The upstream pin ------------------------------------------------------

const corePkg = JSON.parse(readFileSync('packages/core/package.json', 'utf8'));
const pin =
	corePkg.devDependencies?.['@astryxdesign/core'] ??
	corePkg.dependencies?.['@astryxdesign/core'] ??
	'unpinned';

// --- Debts by kind ---------------------------------------------------------

const debtsText = existsSync('port/debts.md') ? readFileSync('port/debts.md', 'utf8') : '';
const debtKinds = {};
for (const match of debtsText.matchAll(/^- \*\*kind:\*\* (.+)$/gm)) {
	const kind = match[1].trim();
	debtKinds[kind] = (debtKinds[kind] ?? 0) + 1;
}
const debtTotal = Object.values(debtKinds).reduce((a, b) => a + b, 0);

// --- Ledger ----------------------------------------------------------------

const ledger = existsSync('port/ledger')
	? readdirSync('port/ledger')
			.filter((f) => /^\d{3}-/.test(f))
			.sort()
	: [];

// --- The gates (--full only) -----------------------------------------------

const gates = [];
if (full) {
	gates.push(
		runStage('Class oracle', 'pnpm', ['-F', '@astryx-svelte/core', 'test:parity']),
		runStage('CSS oracle', 'pnpm', ['-F', '@astryx-svelte/core', 'test:css']),
		runStage('Theme oracles', 'pnpm', ['--filter', './packages/themes/*', 'test']),
		runStage('Test collection', 'pnpm', [
			'-F',
			'@astryx-svelte/core',
			'exec',
			'vitest',
			'list',
			'--reporter=json'
		]),
		runStage('Docs content', 'pnpm', ['-F', 'docs', 'generate'])
	);
}

// --- Render ----------------------------------------------------------------
//
// Markdown tables are rendered by hand rather than left ragged, because
// `port/status.md` must itself be prettier-clean (a later task puts it in the
// lint gate) and prettier reflows GFM tables to pad every column to its
// widest cell. Emitting already-padded tables makes that reflow a no-op
// instead of a diff.

/** Pad every column of `rows` (row 0 is the header) to its widest cell, GFM style. */
function table(rows) {
	const widths = rows[0].map((_, col) => Math.max(...rows.map((r) => r[col].length)));
	const pad = (cell, w) => cell + ' '.repeat(w - cell.length);
	const render = (r) => `| ${r.map((c, i) => pad(c, widths[i])).join(' | ')} |`;
	return [render(rows[0]), render(widths.map((w) => '-'.repeat(w))), ...rows.slice(1).map(render)];
}

const lines = [];
const push = (...l) => lines.push(...l);

push(
	'<!-- GENERATED by scripts/status.mjs — DO NOT EDIT.',
	'     Run `node scripts/status.mjs --full` to regenerate.',
	'     `pnpm verify` fails when this file differs from what is committed. -->',
	'',
	'# Status',
	''
);

push('## Surface', '');
const surfaceRows = [
	['', ''],
	['Component dirs (ours)', String(ours.length)],
	['Component dirs (upstream)', upstreamPresent ? String(theirs.length) : 'upstream clone absent']
];
if (upstreamPresent) {
	surfaceRows.push(
		['Missing here', missing.length === 0 ? 'none' : missing.join(', ')],
		['Not in upstream', invented.length === 0 ? 'none' : invented.join(', ')]
	);
}
surfaceRows.push(
	['Theme packages', `${themes.length} — ${themes.join(', ')}`],
	['Upstream pin', `\`@astryxdesign/core\` ${pin}`],
	['Ledger entries', String(ledger.length)]
);
push(...table(surfaceRows), '');

push('## Debts', '');
const debtRows = [['Kind', 'Count']];
for (const kind of Object.keys(debtKinds).sort()) debtRows.push([kind, String(debtKinds[kind])]);
debtRows.push(['**total**', `**${debtTotal}**`]);
push(...table(debtRows), '');

push('## Gates', '');
if (!full) {
	push('_Not run — regenerate with `node scripts/status.mjs --full`._', '');
} else {
	const gateRows = [['Gate', 'Result', 'Summary']];
	for (const g of gates) {
		gateRows.push([g.name, g.ok ? 'pass' : `FAIL (${g.code})`, lastLine(g.output).slice(0, 120)]);
	}
	push(...table(gateRows), '');
	for (const g of gates) {
		push(`### ${g.name}`, '', '```', g.output, '```', '');
	}
}

writeFileSync('port/status.md', lines.join('\n').trimEnd() + '\n');
console.log(`wrote port/status.md (${full ? 'full' : 'fast'})`);
