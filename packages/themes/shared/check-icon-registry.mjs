// Shared icon-registry check for every `packages/themes/*` package that ships
// one. The per-package `scripts/check-icons.mjs` is a thin caller, exactly as
// `scripts/compare-upstream.mjs` is a thin caller into `compare-theme-css.mjs`.
//
// It checks `src/icons.svelte` — the theme's icon registry — against the things
// it has to agree with, none of which any other gate in this repo covers.
//
// The theme oracle (`compare-theme-css.mjs`) diffs compiled CSS, and a registry
// contributes nothing to `theme.css`, so it is invisible there. `check` is
// `tsc --noEmit` over `src/**/*.ts`, which does not see a `.svelte` file at all.
// Nothing else in these packages imports the registry. So a typo in a Lucide
// export name — `AlertTriangle` written `AlertTriange` — would build clean, lint
// clean, pass the oracle, and ship a theme that renders `undefined` where the
// warning icon should be. This script is what makes that fail.
//
// Four assertions:
//
//   1. Every Lucide name imported by `icons.svelte` is really exported by
//      `@lucide/svelte`. This is the one that needs the dependency installed.
//   2. The registry's keys are exactly core's `IconName` union, in order, and
//      every key has a snippet and every snippet has a key.
//   3. Imports and snippets account for each other exactly.
//   4. The registry is exported under the name this package's `build-theme.mjs`
//      hands to `buildThemePackage`. The eight registries differ *only* in that
//      identifier, so they are near-copies of each other, and a copy that kept
//      the name it was copied from would otherwise fail at build time with the
//      shared build's opaque placeholder error — or worse, silently, if the
//      wrong name happened to exist. This is the one assertion neutral's
//      original standalone version did not have; it became worth making when
//      the registry stopped being unique.
//
// Deliberately textual. The registry cannot be imported here — this runs under
// plain Node and the file is Svelte markup — so it is parsed rather than
// executed, which is also why (2) is worth asserting separately from (1): the
// parse must find all 28 or the whole check is vacuous, and comparing against
// core's union is what proves it did.

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {object} options
 * @param {string} options.packageDir Absolute path to the theme package root.
 * @param {string} options.themeName e.g. `matcha`. Used only in the output.
 * @param {string} options.registryExport The binding `src/icons.svelte` is
 *   expected to export, e.g. `matchaIconRegistry`. Must be the same string the
 *   package's `build-theme.mjs` passes as `icons.name`.
 * @param {() => string} options.resolveLucide Returns the `file://` URL of
 *   `@lucide/svelte`'s entry point — i.e. `() => import.meta.resolve(...)`.
 *
 *   **The caller has to supply this**, for two separate reasons, and both were
 *   found the hard way on the first real install:
 *
 *   1. It cannot be resolved from *this* file. This directory is deliberately
 *      not a workspace package (no `package.json`, so pnpm's
 *      `packages/themes/*` glob skips it), so a bare specifier here walks up to
 *      the repo root and finds nothing. Only the thin caller sits inside a
 *      package that declares the dependency.
 *   2. It must **resolve**, never `import()`. `@lucide/svelte`'s barrel
 *      re-exports `.svelte` files, so plain Node throws `Unknown file extension
 *      ".svelte"` on any attempt to load it. `import.meta.resolve` returns the
 *      path without executing the module, which is what lets this check run
 *      outside a Svelte toolchain at all.
 *
 *   The stub used while this check was written satisfied neither constraint —
 *   it was a plain-JS module behind a loader hook — so the check passed against
 *   a shape the real package does not have.
 */
export async function checkIconRegistry({ packageDir, themeName, registryExport, resolveLucide }) {
	const source = await readFile(join(packageDir, 'src', 'icons.svelte'), 'utf8');

	let failed = false;

	/** @param {string} message */
	function fail(message) {
		console.error(message);
		failed = true;
		process.exitCode = 1;
	}

	// -------------------------------------------------------------------------
	// Parse
	// -------------------------------------------------------------------------

	const importMatch = source.match(/import\s*\{([^}]*)\}\s*from\s*'@lucide\/svelte';/);
	if (!importMatch) {
		fail(`--- no \`@lucide/svelte\` import found in ${themeName}'s src/icons.svelte ---`);
		process.exit(1);
	}
	const imported = importMatch[1]
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);

	// `{#snippet close()}<X {...iconProps} />{/snippet}` → close → X
	const snippets = [...source.matchAll(/\{#snippet\s+(\w+)\(\)\}\s*<(\w+)\b/g)].map(
		([, key, component]) => ({ key, component })
	);

	const registryMatch = source.match(/export const (\w+): IconRegistry = \{([^}]*)\};/);
	if (!registryMatch) {
		fail(
			`--- no \`export const …: IconRegistry = {…}\` found in ${themeName}'s src/icons.svelte ---`
		);
		process.exit(1);
	}
	const declaredExport = registryMatch[1];
	const registryKeys = registryMatch[2]
		.split(',')
		.map((key) => key.trim())
		.filter(Boolean);

	const asList = (names) => names.map((n) => `  ${n}`).join('\n');

	// -------------------------------------------------------------------------
	// 4. The export name the build is going to import
	// -------------------------------------------------------------------------

	if (declaredExport !== registryExport) {
		fail(
			`\n--- registry exported under the wrong name ---\n` +
				`  src/icons.svelte exports  ${declaredExport}\n` +
				`  build-theme.mjs imports   ${registryExport}\n` +
				`  These files are near-copies of each other across the theme packages;\n` +
				`  this is what a copy that kept the original's name looks like.`
		);
	}

	// -------------------------------------------------------------------------
	// 2. Keys vs core's IconName union
	// -------------------------------------------------------------------------

	// Core's published declaration, not its source: these packages already depend
	// on core's built `dist/` (so does the theme definition itself), and the union
	// is emitted there on one line.
	const iconRegistryDts = await readFile(
		join(packageDir, '..', '..', 'core', 'dist', 'components', 'icon', 'icon-registry.d.ts'),
		'utf8'
	);
	const unionMatch = iconRegistryDts.match(/export type IconName =([^;]*);/);
	if (!unionMatch) {
		fail("--- could not find core's `IconName` union in its built dist ---");
		process.exit(1);
	}
	const iconNames = [...unionMatch[1].matchAll(/'([^']+)'/g)].map(([, name]) => name);

	if (registryKeys.join('|') !== iconNames.join('|')) {
		const missing = iconNames.filter((n) => !registryKeys.includes(n));
		const extra = registryKeys.filter((n) => !iconNames.includes(n));
		fail(
			`\n--- registry keys do not match core's IconName union ---\n` +
				`  core declares ${iconNames.length}, the registry has ${registryKeys.length}\n` +
				(missing.length ? `\n  missing from the registry:\n${asList(missing)}\n` : '') +
				(extra.length ? `\n  not an IconName:\n${asList(extra)}\n` : '') +
				(!missing.length && !extra.length ? '\n  same names, different order.\n' : '')
		);
	}

	const snippetKeys = snippets.map(({ key }) => key);
	if (snippetKeys.join('|') !== registryKeys.join('|')) {
		const noSnippet = registryKeys.filter((k) => !snippetKeys.includes(k));
		const unregistered = snippetKeys.filter((k) => !registryKeys.includes(k));
		fail(
			`\n--- snippets and registry keys disagree ---\n` +
				(noSnippet.length ? `\n  registered with no snippet:\n${asList(noSnippet)}\n` : '') +
				(unregistered.length ? `\n  snippet never registered:\n${asList(unregistered)}\n` : '') +
				(!noSnippet.length && !unregistered.length ? '\n  same names, different order.\n' : '')
		);
	}

	// -------------------------------------------------------------------------
	// 3. Imports and snippets account for each other
	// -------------------------------------------------------------------------
	//
	// Each import used exactly once, and no snippet drawing a component it never
	// imported. Catches a stale import left behind by an edit, and a snippet
	// repointed at a different glyph — the one it abandoned falls out as unused.
	//
	// It does *not* catch two snippets having their components swapped (both stay
	// used), nor a name misspelled consistently in both the import and the
	// snippet: that one is internally consistent and only the resolution check
	// below sees it. Which is the reason that check exists rather than being
	// folded into this one.
	const used = snippets.map(({ component }) => component);
	const unused = imported.filter((name) => !used.includes(name));
	const undeclared = used.filter((name) => !imported.includes(name));
	if (unused.length) {
		fail(`\n--- imported from @lucide/svelte but never rendered ---\n${asList(unused)}`);
	}
	if (undeclared.length) {
		fail(`\n--- rendered but never imported ---\n${asList(undeclared)}`);
	}

	// -------------------------------------------------------------------------
	// 1. Lucide export names
	// -------------------------------------------------------------------------
	//
	// Six of these — CheckCircle, XCircle, AlertTriangle, MoreHorizontal, Filter
	// and Columns — are `@deprecated` aliases in Lucide, kept because upstream's
	// `icons.tsx` names them and `lucide-react` carries the identical alias table.
	// They are real exports, so they pass here; see any `src/icons.svelte` for why
	// they are not renamed to the canonical spellings.

	if (typeof resolveLucide !== 'function') {
		fail(
			`\n--- ${themeName}'s check-icons.mjs passed no \`resolveLucide\` ---\n` +
				`  The specifier must be resolved from the package, not from this shared\n` +
				`  directory, which declares no dependencies. Pass\n` +
				`  \`resolveLucide: () => import.meta.resolve('@lucide/svelte')\`.`
		);
		console.error('\nFAILED');
		process.exit(1);
	}

	// The export set is read out of the barrels as *text*. Importing them is not
	// an option — see `resolveLucide` above — and a filename check against
	// `dist/icons/` would false-fail on exactly the six deprecated aliases this
	// port deliberately keeps: `CheckCircle`, `XCircle`, `AlertTriangle`,
	// `MoreHorizontal`, `Filter` and `Columns` have no file of their own, they
	// are re-exported from `dist/aliases/`. So both directories are scanned.
	let exported;
	try {
		const distDir = dirname(fileURLToPath(resolveLucide()));
		const barrels = [join(distDir, 'icons', 'index.js')];
		const aliasDir = join(distDir, 'aliases');
		for (const entry of await readdir(aliasDir)) {
			if (entry.endsWith('.js')) barrels.push(join(aliasDir, entry));
		}

		exported = new Set();
		for (const barrel of barrels) {
			const text = await readFile(barrel, 'utf8');
			for (const [, name] of text.matchAll(/\bas\s+([A-Za-z_$][\w$]*)\b/g)) {
				exported.add(name);
			}
		}
	} catch (error) {
		fail(
			`\n--- could not read @lucide/svelte's export barrels ---\n` +
				`  ${error.message}\n` +
				`  This check needs the dependency installed; run an install first.`
		);
		console.error('\nFAILED');
		process.exit(1);
	}

	const missingExports = imported.filter((name) => !exported.has(name));
	if (missingExports.length) {
		fail(
			`\n--- not exported by @lucide/svelte ---\n${asList(missingExports)}\n` +
				`  Lucide renames icons between majors and the old name is usually kept as a\n` +
				`  deprecated alias — but not always. Check the canonical name before editing.`
		);
	}

	if (failed) {
		console.error('\nFAILED');
	} else {
		console.log(
			`${themeName} icons: ${registryKeys.length} names, ` +
				`${imported.length} Lucide glyphs, all resolved — OK`
		);
	}
}
