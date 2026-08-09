/**
 * @file XLE component registry — built from `@astryx-svelte/core` .doc.mjs metadata.
 *
 * Everything the layout language knows about components (valid names, aliases,
 * props, enums, slots) is derived from the same `.doc.mjs` files that power
 * `component`, so the notation can never drift from the branch's actual API.
 * The pure pieces (alias table, enum parsing, resolution, serialize/hydrate)
 * live in registry-core.mjs so they can run in the browser; this module adds
 * the fs-bound builder.
 *
 * @input  <core>/src/lib per-export `.doc.mjs` files + the `src/lib/index.ts` barrel
 * @output buildRegistry() -> { components, aliases, componentNames }
 * @position foundation/xle — shared by parse/validate/expand; no CLI concerns here
 *
 * ## Three divergences from upstream, all forced by the shape of this port
 *
 * **It does not call `foundation/discovery/`.** Upstream's builder composes
 * `discoverComponents` + `findComponentReadme` + `resolveImportPath` +
 * `loadDocs`, because upstream's docs are scattered — one main `<Dir>.doc.mjs`
 * per component directory, sub-components documented in sibling files, and
 * structural pieces with no doc at all. It needs three passes to reassemble
 * that. This port's core ships **one `.doc.mjs` per documented export, named
 * for the export and placed beside its source module** (see TODO.md, "Core
 * ships 209 .doc.mjs"), so a single walk of `src/lib` *is* the doc index and
 * upstream's second pass (`upgradeFromDoc`) has nothing left to recover. What
 * remains is a plain directory walk plus a dynamic import, which is why this
 * file owns them rather than reaching into a module `component`/`util` owns.
 *
 * **There are no per-component subpath exports.** `@astryxdesign/core` publishes
 * `./Button`, `./Card`, … so upstream resolves a distinct `importPath` per
 * component; `@astryx-svelte/core` publishes one root barrel, so every
 * component's `importPath` is the package name and the generated module ends
 * up with a single merged import statement.
 *
 * **The undocumented backfill reads the root barrel, not per-directory
 * `index.ts` files.** Same purpose — recover exported-but-doc-less structural
 * pieces (TableHeader, TableBody, TableFooter, Stack) so they can be named in
 * an expression and emitted by the Table partitioner — but this port has one
 * barrel where upstream has ~97 directory indexes. See readBarrelComponents.
 */

import fs from 'node:fs';
import path from 'node:path';
import { findCoreDir } from '../fs/paths.mjs';
import { CORE_PACKAGE } from '../discovery/component-discovery.mjs';
import { importUserModule } from '../fs/module-loader.mjs';
import { ALIAS_TABLE, normalizeName, toComponentEntry } from './registry-core.mjs';

// Re-export the pure surface so existing importers (and tests) keep working.
export {
	ALIAS_TABLE,
	SPACING_STEPS,
	parseEnumValues,
	resolveComponent,
	serializeRegistry,
	hydrateRegistry
} from './registry-core.mjs';

/**
 * Match a value re-export statement's brace group. PascalCase names are kept
 * by the caller's filters; hooks (`useX`), lowercase helpers and `type`
 * specifiers are dropped there.
 *
 * `export type {…}` never matches, because the pattern requires the brace to
 * follow `export` with nothing but whitespace between.
 */
const NAMED_EXPORT_RE = /export\s*\{([^}]*)\}/g;

/**
 * Recursively collect every `.doc.mjs` under a directory.
 * @param {string} dir
 * @param {string[]} [out]
 * @returns {string[]} absolute paths
 */
function collectDocFiles(dir, out = []) {
	/** @type {fs.Dirent[]} */
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) collectDocFiles(full, out);
		else if (entry.name.endsWith('.doc.mjs')) out.push(full);
	}
	return out;
}

/**
 * Read the PascalCase component names the core barrel re-exports.
 *
 * Used to recover structural sub-components that ship without their own
 * `.doc.mjs` (TableHeader, TableBody, TableFooter, Stack) — the doc-driven pass
 * above cannot see those, but the layout language still needs to name and emit
 * them, and three of them are alias targets (TH / TB / TF).
 *
 * Upstream's equivalent reads one `index.ts` per component directory and keeps
 * the **left** side of an `as` pair. That is wrong for an aliased re-export
 * (the published name is the right side) and simply does not work here, where
 * every component line is `export { default as Name } from '…'` and the left
 * side is the keyword `default`. So this keeps the right side. Everything else
 * — the PascalCase filter, the `type ` skip, the Context/Provider exclusion —
 * is upstream's, unchanged.
 *
 * @param {string} libDir  `<core>/src/lib`
 * @returns {Array<{name: string, dirName: string}>}
 */
function readBarrelComponents(libDir) {
	let content;
	try {
		content = fs.readFileSync(path.join(libDir, 'index.ts'), 'utf-8');
	} catch {
		return [];
	}
	/** @type {Map<string, string>} */
	const found = new Map();
	for (const match of content.matchAll(NAMED_EXPORT_RE)) {
		// The module specifier of this statement, if it has one — its second path
		// segment under `components/` is the component directory.
		const after = content.slice(match.index + match[0].length, match.index + match[0].length + 200);
		const from = after.match(/^\s*from\s*'([^']+)'/);
		const dirName = from ? (from[1].match(/components\/([^/]+)\//)?.[1] ?? '') : '';
		for (const raw of match[1].split(',')) {
			const token = raw.trim();
			if (!token || token.startsWith('type ')) continue;
			const parts = token.split(/\s+as\s+/);
			const name = normalizeName((parts[1] ?? parts[0]).trim());
			// PascalCase components only — skip hooks (useX), lowercase utils, and
			// non-rendering exports (Context/Provider).
			if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue;
			if (/(?:Context|Provider)$/.test(name)) continue;
			if (!found.has(name)) found.set(name, dirName || name);
		}
	}
	return [...found].map(([name, dirName]) => ({ name, dirName }));
}

let cachedRegistry = /** @type {import('./xle-ast').Registry | null} */ (null);

/**
 * Reset the module-level registry cache. Test-only; upstream has no equivalent
 * because its suites never need two registries in one process.
 */
export function _resetRegistryCache() {
	cachedRegistry = null;
}

/**
 * Build (and cache) the registry: every documented component keyed by its
 * name, plus the validated alias map.
 *
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @returns {Promise<import('./xle-ast').Registry>}
 */
export async function buildRegistry({ cwd = process.cwd() } = {}) {
	if (cachedRegistry) return cachedRegistry;

	const coreDir = findCoreDir(cwd);
	if (!coreDir) {
		throw new Error(
			`Could not find ${CORE_PACKAGE} package — run from a project that has it installed`
		);
	}
	const libDir = path.join(coreDir, 'src', 'lib');

	/** @type {Map<string, import('./xle-ast').RegistryComponent>} */
	const components = new Map();

	/**
	 * @param {string} rawName
	 * @param {import('./xle-ast').DocProp[]} props
	 * @param {string} dirName
	 */
	const register = (rawName, props, dirName) => {
		const name = normalizeName(rawName);
		const entry = toComponentEntry(name, props, dirName, CORE_PACKAGE);
		const existing = components.get(name);
		// Some docs cross-reference related components with empty prop arrays —
		// prefer the richer entry.
		if (!existing || entry.props.size > existing.props.size) components.set(name, entry);
	};

	for (const file of collectDocFiles(libDir)) {
		/** @type {any} */
		let docs;
		try {
			docs = (await importUserModule(file)).default;
		} catch {
			continue; // a malformed doc must not take down the whole language
		}
		if (!docs || typeof docs !== 'object') continue;
		// `type: 'function'` entries are the hook/util docs. Upstream filters them
		// out one layer earlier, inside discoverComponents; the filter has to live
		// here because this port reads the doc files directly.
		if (docs.type !== 'component') continue;
		const dirName = path.basename(path.dirname(file));
		const fallbackName = path.basename(file).replace(/\.doc\.mjs$/, '');
		if (docs.props) register(docs.name || fallbackName, docs.props, dirName);
		// Upstream's docs can nest sub-component entries; this port's generated
		// ones never do (one file per export), but the loop costs nothing and a
		// hand-authored doc could still carry one.
		for (const sub of docs.components || []) {
			if (sub?.name) register(sub.name, sub.props, dirName);
		}
	}

	// Exported components without their own doc entry still get minimal registry
	// entries so they can be named in expressions — the validator warns rather
	// than validates their props.
	for (const { name, dirName } of readBarrelComponents(libDir)) {
		if (components.has(name)) continue;
		const entry = toComponentEntry(name, [], dirName, CORE_PACKAGE);
		entry.undocumented = true;
		components.set(name, entry);
	}

	/** @type {Map<string, string>} */
	const aliases = new Map();
	for (const [alias, target] of Object.entries(ALIAS_TABLE)) {
		if (components.has(target)) aliases.set(alias, target);
	}

	cachedRegistry = {
		components,
		aliases,
		componentNames: [...components.keys()].sort()
	};
	return cachedRegistry;
}
