// Reads the published export surface of @astryx-svelte/core.
//
// The docs site documents *this* library, so the component registry is filtered
// to what core actually exports — upstream ships 200 sidebar entries and we
// have not ported all of them. Guessing from the source barrel with a regex
// would miss multi-line and re-export forms, so the generated `.d.ts` files are
// parsed with the TypeScript compiler instead: they are the same artifact
// consumers typecheck against.

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * Value (not type) exports declared by one `.d.ts` entry point, each paired
 * with the module it is re-exported *from*.
 *
 * `export type {…}` and the `type` specifier inside a mixed clause are skipped —
 * a props interface is not a documentable component.
 *
 * The module specifier is kept because the barrel is the only place that maps
 * an export back to its source, and a filename rule gets it wrong: ten
 * `Breadcrumb*` names are `dropdown-menu-*.svelte` published under another
 * name, `HStack` is `hstack.svelte`, and `Theme` is not under `components/` at
 * all. TODO.md's slice-2 entry measured this — name → directory is not a
 * function — and concluded "the barrel is the index and the filesystem is not a
 * naming convention". `emit-core-docs.mjs` is the first caller that needs the
 * other half of that index.
 *
 * @param {string} filePath
 * @returns {Array<{name: string, moduleSpecifier: string | null}>}
 */
function readEntryPoint(filePath) {
	/** @type {Array<{name: string, moduleSpecifier: string | null}>} */
	const found = [];
	if (!fs.existsSync(filePath)) return found;

	const source = ts.createSourceFile(
		filePath,
		fs.readFileSync(filePath, 'utf8'),
		ts.ScriptTarget.ESNext,
		true
	);

	for (const statement of source.statements) {
		if (!ts.isExportDeclaration(statement)) continue;
		// `export * from …` carries no names to collect here; every entry point
		// core ships lists its exports explicitly, so this is not a silent gap.
		if (statement.isTypeOnly || !statement.exportClause) continue;
		if (!ts.isNamedExports(statement.exportClause)) continue;

		const moduleSpecifier =
			statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
				? statement.moduleSpecifier.text
				: null;

		for (const specifier of statement.exportClause.elements) {
			if (specifier.isTypeOnly) continue;
			found.push({ name: specifier.name.text, moduleSpecifier });
		}
	}

	return found;
}

/**
 * Every value exported from core's entry points, keyed by the subpath a
 * consumer imports it from. The subpath becomes the import snippet shown on
 * each component page, so it has to be the real one.
 *
 * `sourceModuleByName` carries the other half — the module each name is
 * re-exported from, e.g. `BreadcrumbMenuItem` →
 * `components/dropdown-menu/dropdown-menu-item.svelte`. Its directory is the
 * component's source directory, which is where a co-located `.doc.mjs` belongs.
 *
 * Each specifier is resolved **against its own entry point** before being
 * stored, so the map is uniformly `dist`-relative. A subpath barrel writes
 * paths relative to itself — `hooks/index.d.ts` exports `useMediaQuery` from
 * `./use-media-query.svelte.js` — and taking that at face value puts every hook
 * that the root barrel does not name individually at the package root.
 *
 * @param {string} coreDistDir absolute path to packages/core/dist
 * @returns {{
 *   names: Set<string>,
 *   importPathByName: Map<string, string>,
 *   sourceModuleByName: Map<string, string>
 * }}
 */
export function readCoreExports(coreDistDir) {
	/** Entry point → the specifier consumers write. Order matters: the root
	 * barrel wins, because that is what upstream's own import snippets use. */
	const entryPoints = [
		['index.d.ts', '@astryx-svelte/core'],
		['hooks/index.d.ts', '@astryx-svelte/core/hooks'],
		['theme/index.d.ts', '@astryx-svelte/core/theme'],
		['theme/syntax/index.d.ts', '@astryx-svelte/core/theme/syntax'],
		['utils/index.d.ts', '@astryx-svelte/core/utils'],
		['i18n/index.d.ts', '@astryx-svelte/core/i18n']
	];

	/** @type {Set<string>} */
	const names = new Set();
	/** @type {Map<string, string>} */
	const importPathByName = new Map();
	/** @type {Map<string, string>} */
	const sourceModuleByName = new Map();

	for (const [relative, importPath] of entryPoints) {
		for (const { name, moduleSpecifier } of readEntryPoint(path.join(coreDistDir, relative))) {
			names.add(name);
			if (!importPathByName.has(name)) importPathByName.set(name, importPath);
			if (moduleSpecifier && !sourceModuleByName.has(name)) {
				const from = path.posix.dirname(relative.split(path.sep).join('/'));
				sourceModuleByName.set(name, path.posix.normalize(path.posix.join(from, moduleSpecifier)));
			}
		}
	}

	return { names, importPathByName, sourceModuleByName };
}
