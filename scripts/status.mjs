#!/usr/bin/env node
// Generates `port/status.md`. Every countable claim about this port is derived
// here rather than typed, because the typed ones drifted: "100 / 100" survived
// three batches after upstream moved to 101, and the file it lived in ended up
// instructing readers not to trust its own numbers.
//
// Design rules:
//   - Capture, do not parse. Each gate's own stdout is printed verbatim with
//     its exit code. Regexing a number out of prose is the fragility this
//     script exists to remove.
//   - Deterministic output only. No clock, no paths, no SHAs — `verify.mjs`
//     gates on `git diff --exit-code port/status.md`, so a timestamp would
//     fail every run.
//   - The committed file holds metrics, not logs. `--full`'s gate results
//     (pass/fail table plus captured output) print to stdout only — a gate
//     run is a log, not a metric, and a file whose content depended on which
//     tier generated it could never be green in both `--fast` and `--full`
//     at once (it wasn't: the committed file was the fast tier, and CI's
//     `--no-client` run — full tier — failed the drift gate on every run).
//     `port/status.md` is now byte-identical whether `status.mjs` ran fast or
//     `--full` — generate at both and `diff` them to confirm.
//
// Usage: node scripts/status.mjs [--full]
//   default  filesystem counts, manifest pins and debt tallies. Seconds.
//   --full   additionally runs the oracles, `vitest list` and the docs
//            generator, and prints their pass/fail table and captured output
//            to stdout. Minutes. Does not change what's written to the file.

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

// --- Test parity -----------------------------------------------------------
//
// The largest parity axis this file did not measure. CLAUDE.md makes a suite's
// case count a contract against upstream's file at the current pin, but nothing
// counted the suites that have no counterpart at all — so "which upstream
// suites are unported?" lived in prose, in the one repo whose central rule is
// that a count belongs here and nowhere else.
//
// Attribution, deliberately generous in one direction and strict in the other:
// an upstream suite counts as covered when some file under
// `packages/core/src/tests/` names it (`Foo.test.tsx` appearing anywhere in the
// text — headers name every upstream suite they fold together) or carries its
// kebab-cased basename. Generous, because a false "covered" is visible the
// moment someone opens the file, whereas a false "unported" sends work at a
// suite that already exists. What it never does is guess at case-level
// coverage: a suite that is present but short states that in its own header,
// which is the mechanism that already exists for it.
// A bare `it`/`test` must be followed by a call paren. Only the table forms,
// it.each and it.for, are tagged templates, so only those may be followed by a
// backtick. The single character class this replaces accepted a backtick after
// a bare `it` too — which is not a vitest API at all, but is exactly what an
// identifier quoted in prose looks like. Since backticks are this repo's house
// style and upstream's, every doc comment mentioning `it` counted as a
// declaration: two upstream suites were credited one case more than they
// declare, and two of batch 033's own headers scanned at four times their real
// contract. A header written to explain its own counting was the thing most
// able to corrupt it.
//
// The lookbehind also rejects a preceding backtick, which is what closes the
// other half. `it.each` and `it.for` really are tagged templates, so the second
// alternative below has to accept a backtick after them - and that made a
// backtick-quoted `it.each` in prose match all over again, exactly the way the
// bare form used to. In code nothing precedes `it` with a backtick; in prose
// that is precisely what does.
const testCase =
	/(?<![\w.`])(?:it|test)(?:\.(?:each|skip|only|todo|fails|concurrent|for))?\s*\(|(?<![\w.`])(?:it|test)\.(?:each|for)\s*`/g;
const countCases = (file) => (readFileSync(file, 'utf8').match(testCase) ?? []).length;

/** Every `*.test.ts`/`*.test.tsx` under `dir`, recursively, as absolute paths. */
function testFiles(dir) {
	if (!existsSync(dir)) return [];
	const out = [];
	for (const e of readdirSync(dir, { withFileTypes: true, recursive: true })) {
		if (!e.isFile() || !/\.test\.tsx?$/.test(e.name)) continue;
		out.push(path.join(e.parentPath ?? e.path, e.name));
	}
	return out.sort();
}

// Upstream suites this port will never have a counterpart for, each with the
// reason and the same hygiene rule the class oracle's skips carry: an entry
// that stops matching an upstream file fails the run, and so does one whose
// suite turns out to be covered after all. The list cannot rot into an alibi.
const NO_TEST_COUNTERPART = {
	'utils/mergeProps.test.ts': 'mergeProps is not ported — Svelte obviates it (see utils/index.ts)',
	'utils/mergeRefs.test.ts': 'mergeRefs is not ported — Svelte has no ref object to merge',
	'utils/composeEventHandlers.test.ts': 'composeEventHandlers is not ported — Svelte obviates it',
	// Both rest entirely on machinery this port does not and cannot have.
	'serverSafeComponents.test.ts':
		"guards the React Server Components boundary — no 'use client' directive in Svelte, no react-server condition, no per-component subpaths",
	'__tests__/babelPluginAddExtensions.test.ts':
		'guards a Babel plugin that adds file extensions during upstream\'s build; svelte-package does the inverse and this port has no such transform',
	// Two more absences already recorded elsewhere, reached through a different
	// door. Both were counted as unported for the whole 0.5.0 delta, which
	// overstated the work remaining by 5 cases and pointed it at suites that
	// can never be written.
	'hooks/useMergedRefs.test.tsx':
		'useMergedRefs is not ported — Svelte binds an element once via bind:this and a focus trap arrives as an attachment, so there is no callback ref identity to stabilise (port/debts.md records it as never retiring)',
	// Upstream's own header calls this the narrow sibling of
	// serverSafeComponents.test.ts above, and every assertion in it reads a
	// module prologue for the directive.
	'theme/syntax/serverSafeSyntax.test.ts':
		"guards the React Server Components boundary for the ./theme/syntax subpath — no 'use client' directive in Svelte, same reason as serverSafeComponents.test.ts"
};

const upstreamTests = testFiles(upstreamRoot).map((f) => ({
	rel: path.relative(upstreamRoot, f).split(path.sep).join('/'),
	cases: countCases(f)
}));

const ourTestText = testFiles(path.join(root, 'packages/core/src/tests'))
	.map((f) => ({ base: path.basename(f), text: readFileSync(f, 'utf8') }))
	.filter((f) => !/\.d\.ts$/.test(f.base));
const ourStems = new Set(
	ourTestText.map((f) => f.base.replace(/\.svelte\.test\.ts$/, '').replace(/\.test\.ts$/, ''))
);
const namedUpstream = new Set(
	ourTestText.flatMap((f) => f.text.match(/[A-Za-z0-9_.-]+\.test\.tsx?/g) ?? [])
);

// A header that names an upstream suite in order to say it is NOT ported was
// being read as coverage — `layout.svelte.test.ts` understated the gap by 34
// cases with the very sentence written to be honest about it. `UNPORTED: <path>`
// subtracts instead, and errs safe: a marker left behind after the suite is
// genuinely ported overstates the work remaining rather than hiding it.
const markedUnported = new Set(
	ourTestText.flatMap((f) =>
		[...f.text.matchAll(/UNPORTED:\s*([A-Za-z0-9_./-]+\.test\.tsx?)/g)].map((m) =>
			m[1].split('/').pop()
		)
	)
);

const kebab = (s) =>
	s
		.replace(/(?<=[a-z0-9])(?=[A-Z])/g, '-')
		.replace(/(?<=[A-Z])(?=[A-Z][a-z])/g, '-')
		.toLowerCase();

const isCovered = ({ rel }) => {
	const base = rel.split('/').pop();
	if (markedUnported.has(base)) return false;
	if (namedUpstream.has(base)) return true;
	const stem = kebab(base.replace(/\.test\.tsx?$/, ''));
	return ourStems.has(stem) || ourStems.has(stem.replace(/^use-/, ''));
};

const upstreamSuites = upstreamTests.filter((t) => t.cases > 0);
const covered = upstreamSuites.filter(isCovered);
const uncovered = upstreamSuites.filter((t) => !isCovered(t));
const excusedRels = new Set(Object.keys(NO_TEST_COUNTERPART));
const excused = uncovered.filter((t) => excusedRels.has(t.rel));
const unported = uncovered.filter((t) => !excusedRels.has(t.rel));

// Skip hygiene, both directions — see NO_TEST_COUNTERPART above.
if (upstreamPresent) {
	const known = new Set(upstreamSuites.map((t) => t.rel));
	const stale = [...excusedRels].filter((rel) => !known.has(rel));
	const redundant = covered.filter((t) => excusedRels.has(t.rel)).map((t) => t.rel);
	if (stale.length > 0 || redundant.length > 0) {
		for (const rel of stale) {
			console.error(`NO_TEST_COUNTERPART: '${rel}' matches no upstream suite — entry is stale`);
		}
		for (const rel of redundant) {
			console.error(`NO_TEST_COUNTERPART: '${rel}' is covered here — entry is redundant`);
		}
		process.exit(1);
	}
}

const sumCases = (list) => list.reduce((a, t) => a + t.cases, 0);

// --- Assertion strength ----------------------------------------------------
//
// `getByRole(role, {name: 'X'})` does not mean the same thing on both sides.
// Testing Library matches the accessible name as a **whole string**; the
// browser project's locators are Playwright's, where a string `name` is a
// **substring**, case-insensitive. So a ported case that reads verbatim is
// quietly weaker than upstream's, and passes in cases upstream's would fail —
// demonstrated concretely on `VisuallyHidden`, where an icon that lost its
// `aria-hidden` made the accessible name `'Trash Delete'` and the case still
// passed until `exact: true` was added.
//
// A regex `name` is substring-matching on both sides by design, so it is not
// counted. Only string literals are, and the number is the size of the sweep
// that has not happened yet — every one of them is a place where our assertion
// admits names upstream's would reject.
const NAME_STRING = /getBy(?:Role|LabelText)\([^)]*name:\s*'/g;
const NAME_EXACT = /getBy(?:Role|LabelText)\([^)]*name:\s*'[^']*'[^)]*exact:\s*true/g;

let looseNameSites = 0;
let looseNameFiles = 0;
for (const file of testFiles(path.join(root, 'packages/core/src/tests'))) {
	const text = readFileSync(file, 'utf8');
	const total = (text.match(NAME_STRING) ?? []).length;
	const exact = (text.match(NAME_EXACT) ?? []).length;
	if (total - exact > 0) {
		looseNameSites += total - exact;
		looseNameFiles += 1;
	}
}

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

const debtsFile = existsSync('port/debts.md') ? readFileSync('port/debts.md', 'utf8') : '';
// Stop at `## Retired`: entries below it are closed and kept only as the record.
// Counting them would report a debt that no longer exists, and the same heads are
// what `astryx-parity` greps to ask whether drift is already known.
const retiredAt = debtsFile.indexOf('\n## Retired');
const debtsText = retiredAt === -1 ? debtsFile : debtsFile.slice(0, retiredAt);
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

if (upstreamPresent) {
	push('## Test parity', '');
	push(
		...table([
			['', 'Suites', 'Declared cases'],
			['Upstream', String(upstreamSuites.length), String(sumCases(upstreamSuites))],
			['Ported here', String(covered.length), String(sumCases(covered))],
			['No counterpart by design', String(excused.length), String(sumCases(excused))],
			['**Unported**', `**${unported.length}**`, `**${sumCases(unported)}**`]
		]),
		''
	);
	push(
		'A ported suite may still be short of upstream; that shortfall is stated in the suite’s own',
		'header, which is the contract CLAUDE.md defines. Cases are `it`/`test` declarations, so an',
		'`it.each` counts once rather than per row.',
		''
	);
	if (unported.length > 0) {
		push('<details><summary>Unported upstream suites</summary>', '');
		push(
			...table([
				['Suite', 'Cases'],
				...unported
					.slice()
					.sort((a, b) => b.cases - a.cases || a.rel.localeCompare(b.rel))
					.map((t) => [`\`${t.rel}\``, String(t.cases)])
			]),
			'',
			'</details>',
			''
		);
	}
}

push('## Assertion strength', '');
push(
	...table([
		['', 'Sites', 'Files'],
		[
			"`getByRole`/`getByLabelText` with a string `name`, no `exact`",
			String(looseNameSites),
			String(looseNameFiles)
		]
	]),
	''
);
push(
	'Testing Library matches an accessible name as a whole string; Playwright matches a string',
	'`name` as a case-insensitive **substring**. Every site above is therefore a ported assertion',
	'weaker than the one it ports, admitting names upstream’s would reject. A regex `name` is',
	'substring-matching on both sides by design and is not counted.',
	''
);

push('## Debts', '');
const debtRows = [['Kind', 'Count']];
for (const kind of Object.keys(debtKinds).sort()) debtRows.push([kind, String(debtKinds[kind])]);
debtRows.push(['**total**', `**${debtTotal}**`]);
push(...table(debtRows), '');

writeFileSync('port/status.md', lines.join('\n').trimEnd() + '\n');
console.log(`wrote port/status.md (${full ? 'full' : 'fast'})`);

// The gates are a log, not a metric — printed to stdout only, never written
// to the committed file. See the header comment for why.
if (full) {
	console.log('\n=== Gates ===\n');
	const gateRows = [['Gate', 'Result', 'Summary']];
	for (const g of gates) {
		gateRows.push([g.name, g.ok ? 'pass' : `FAIL (${g.code})`, lastLine(g.output).slice(0, 120)]);
	}
	for (const line of table(gateRows)) console.log(line);
	for (const g of gates) {
		console.log(`\n--- ${g.name} ---\n${g.output}`);
	}
}
