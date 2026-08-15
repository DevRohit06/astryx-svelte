/**
 * @file Component discovery — find, list, and resolve Astryx components.
 *
 * ## The one structural difference from upstream
 *
 * Upstream discovers a component by scanning `<core>/src/<PascalName>/` for an
 * `XDS<Name>.tsx` (or bare `<Name>.tsx`) file: the directory *is* the component
 * name and the filename *is* the export name, so name → path is a function and
 * every lookup is an `existsSync` probe at a predictable place.
 *
 * Neither half holds here, and both were measured before being replaced (see
 * port/todo.md, slice 2). Our directories are kebab-case; **98 of 191 exported
 * components have no directory of their own** (`AvatarStatusDot` lives in
 * `avatar/`, `ChatComposer` in `chat/`); and a filename rule breaks three ways
 * at once — aliased re-exports (`BreadcrumbMenuItem` *is* `dropdown-menu-item.svelte`),
 * casing (`hstack.svelte` pascalises to `Hstack`, not `HStack`) and location
 * (`Theme` lives under `src/lib/theme/`, not `components/`).
 *
 * So this port reads two indexes instead of guessing a path, and both are
 * things core actually publishes:
 *
 *   1. **The 209 co-located `.doc.mjs` files** name → doc. Each is named for its
 *      export and sits in that export's source directory
 *      (`components/button/Button.doc.mjs`,
 *      `components/dropdown-menu/DropdownMenuItem.doc.mjs`). This is upstream's
 *      own file convention, so `discoverComponents` walks docs where upstream
 *      walks sources — the same algorithm over a different index.
 *   2. **The source barrels** (`src/lib/index.ts` and the five subpath barrels)
 *      name → source module. Only the barrel survives all three breakages
 *      above; it resolves **209 of 209** documented entries, where the best
 *      filename rule manages 163. No TypeScript compiler is involved — the
 *      re-export statements are read directly, as upstream's `resolveImportPath`
 *      reads `package.json#exports` directly.
 *
 * Both indexes are built by one walk of `src/lib` and memoized per core
 * directory. That memo is **required by the adaptation, not an optimization**:
 * upstream's lookups are O(1) probes at known paths, ours must walk, and
 * `component --list --detail compact` performs one per component.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/** The owner package name for built-in (core) components. */
export const CORE_PACKAGE = '@astryx-svelte/core';

/**
 * Top-level `src/lib` directories `discoverComponents` never lists from.
 * Upstream's set verbatim: `hooks` is `hook-discovery`'s, `utils` ships no
 * docs, and the other two are never source.
 */
const SKIP_DIRS = new Set(['hooks', 'utils', '__tests__', 'node_modules']);

/** Directories the index walk never descends into, at any depth. */
const WALK_SKIP_DIRS = new Set(['__tests__', 'node_modules']);

/** Conventional doc-file suffixes for integration components (same-stem). */
const INTEGRATION_DOC_SUFFIXES = ['.doc.ts', '.doc.mjs', '.doc.js'];

/**
 * The source extension an integration contributes. Upstream's is `.tsx`; a
 * Svelte integration ships `.svelte`, and this is the only place the swizzleable
 * source extension is spelled.
 */
const INTEGRATION_SOURCE_EXT = '.svelte';

/**
 * A documented export's name, as it appears in a doc filename. Upstream's
 * `/^[A-Z]\w+\.tsx$/` applied to source files; the same shape applied to doc
 * names is what separates a component doc from a `use*` one, and it is exactly
 * the split `hook-discovery` makes from the other side.
 */
const COMPONENT_NAME_RE = /^[A-Z]\w+$/;

// Top-level doc fields, matched at their own indentation. Upstream allows 0-2
// SPACES because its docs are prettier-formatted with two-space indent; ours are
// tab-indented, so a top-level field carries exactly one tab and a nested one
// carries two or more. Accepting "one tab OR up to two spaces" reads both — which
// matters because an integration's docs are third-party files we do not format.
// The nested case is the ChatMessageBubble bug upstream fixed: a `group:` inside
// a translation's propDescriptions block must never be read as the group.
const GROUP_RE = /(?:^|\n)(?:\t| {0,2})group:\s*['"]([^'"]+)['"]/;
const HIDDEN_COMPONENTS_RE = /(?:^|\n)(?:\t| {0,2})hiddenComponents:\s*\[([^\]]*)\]/;
const HIDDEN_RE = /(?:^|\n)(?:\t| {0,2})hidden:\s*true/;

/** A quoted string inside a `hiddenComponents` array literal. */
const QUOTED_RE = /['"]([^'"]+)['"]/g;

/**
 * One documented export found by the index walk.
 * @typedef {object} DocEntry
 * @property {string} name export name, i.e. the doc filename without `.doc.mjs`
 * @property {string} docPath absolute path to the doc file
 * @property {string} topDir the `src/lib` child it lives under ('' at the root)
 */

/**
 * The two indexes, built together by one walk.
 * @typedef {object} CoreIndex
 * @property {DocEntry[]} docs every `*.doc.mjs` under `src/lib`, path-sorted
 * @property {Map<string, string>} docsByName export name → doc path (first wins)
 * @property {Map<string, string>} sourcesByName export name → source module path
 */

/** @type {Map<string, CoreIndex>} */
const indexCache = new Map();

/**
 * Read the `group`, `hiddenComponents`, and `hidden` fields from a doc file
 * (synchronous, by regex — the file is never executed).
 * @param {string} docPath
 * @returns {{group: string | null, hiddenComponents: Set<string>, hidden: boolean}}
 */
function readDocMeta(docPath) {
	try {
		const content = fs.readFileSync(docPath, 'utf-8');
		const groupMatch = GROUP_RE.exec(content);
		const hiddenCompsMatch = HIDDEN_COMPONENTS_RE.exec(content);
		/** @type {Set<string>} */
		const hiddenSet = new Set();
		if (hiddenCompsMatch) {
			for (const m of hiddenCompsMatch[1].matchAll(QUOTED_RE)) {
				hiddenSet.add(m[1]);
			}
		}
		const hidden = HIDDEN_RE.test(content);
		return {
			group: groupMatch ? groupMatch[1] : null,
			hiddenComponents: hiddenSet,
			hidden
		};
	} catch {
		return { group: null, hiddenComponents: new Set(), hidden: false };
	}
}

/**
 * Resolve a barrel's relative specifier to a real file. Barrels are TypeScript
 * and import with the emitted `.js` extension, so `./use-theme.svelte.js` has to
 * be tried as `.svelte.ts` too; a bare directory specifier resolves to its
 * `index.ts`.
 * @param {string} fromDir directory holding the barrel
 * @param {string} spec the `from '...'` specifier
 * @returns {string | null}
 */
function resolveSpecifier(fromDir, spec) {
	if (!spec.startsWith('.')) return null;
	const base = path.resolve(fromDir, spec);
	const candidates = [
		base,
		base.replace(/\.js$/, '.ts'),
		base.replace(/\.js$/, '.svelte.ts'),
		`${base}.ts`,
		path.join(base, 'index.ts')
	];
	for (const candidate of candidates) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate;
		} catch {
			// next candidate
		}
	}
	return null;
}

// A single `export {...} from '...'` statement. `[^}]*` spans newlines, so the
// multi-line clause form is read as well as the one-line one — the form a
// line-anchored regex would miss. Group 1 is the `type` keyword when present, so
// a type-only re-export can be dropped without matching it separately.
const EXPORT_FROM_RE = /export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;

/** A `X as Y` clause inside an export list. */
const AS_CLAUSE_RE = /^(\S+)\s+as\s+(\S+)$/;

/**
 * Parse one barrel into `exportName → source module path` pairs.
 * @param {string} barrelPath
 * @param {Map<string, string>} into
 */
function indexBarrel(barrelPath, into) {
	let source;
	try {
		source = fs.readFileSync(barrelPath, 'utf-8');
	} catch {
		return;
	}
	const dir = path.dirname(barrelPath);
	for (const match of source.matchAll(EXPORT_FROM_RE)) {
		if (match[1]) continue; // `export type {...}` — no runtime binding
		const resolved = resolveSpecifier(dir, match[3]);
		if (!resolved) continue;
		for (const raw of match[2].split(',')) {
			const clause = raw.trim();
			if (!clause || clause.startsWith('type ')) continue;
			const aliased = AS_CLAUSE_RE.exec(clause);
			const name = aliased ? aliased[2] : clause;
			if (!into.has(name)) into.set(name, resolved);
		}
	}
}

/**
 * Build both indexes with one walk of `<core>/src/lib`.
 *
 * The top-level `readdirSync` is deliberately unguarded, as upstream's is: a
 * core directory with no source tree is a broken install, and an ENOENT naming
 * the path it looked for is a better answer than an empty component list. Pinned
 * by a ported case.
 * @param {string} coreDir
 * @returns {CoreIndex}
 */
function buildIndex(coreDir) {
	const srcLib = path.join(coreDir, 'src', 'lib');
	/** @type {DocEntry[]} */
	const docs = [];
	/** @type {string[]} */
	const barrels = [];

	/**
	 * @param {string} dir
	 * @param {string} topDir
	 */
	const walk = (dir, topDir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (WALK_SKIP_DIRS.has(entry.name)) continue;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full, topDir);
			} else if (entry.name.endsWith('.doc.mjs')) {
				docs.push({ name: entry.name.slice(0, -'.doc.mjs'.length), docPath: full, topDir });
			} else if (entry.name === 'index.ts') {
				barrels.push(full);
			}
		}
	};

	for (const entry of fs.readdirSync(srcLib, { withFileTypes: true })) {
		if (WALK_SKIP_DIRS.has(entry.name)) continue;
		const full = path.join(srcLib, entry.name);
		if (entry.isDirectory()) walk(full, entry.name);
		else if (entry.name.endsWith('.doc.mjs'))
			docs.push({ name: entry.name.slice(0, -'.doc.mjs'.length), docPath: full, topDir: '' });
		else if (entry.name === 'index.ts') barrels.push(full);
	}

	docs.sort((a, b) => a.docPath.localeCompare(b.docPath));
	/** @type {Map<string, string>} */
	const docsByName = new Map();
	for (const doc of docs) {
		if (!docsByName.has(doc.name)) docsByName.set(doc.name, doc.docPath);
	}

	// Shallowest barrel first, so the root surface wins a name it shares with a
	// subpath barrel (both are valid; the root is the canonical one).
	barrels.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length || a.localeCompare(b));
	/** @type {Map<string, string>} */
	const sourcesByName = new Map();
	for (const barrel of barrels) indexBarrel(barrel, sourcesByName);

	return { docs, docsByName, sourcesByName };
}

/**
 * The memoized index for a core directory. A single CLI invocation never
 * mutates core, so the cache lives for the process.
 * @param {string} coreDir
 * @returns {CoreIndex}
 */
function coreIndex(coreDir) {
	const key = path.resolve(coreDir);
	const hit = indexCache.get(key);
	if (hit) return hit;
	const built = buildIndex(key);
	indexCache.set(key, built);
	return built;
}

/**
 * Discard the memoized indexes. Test-only: a suite that writes a fixture,
 * queries it, then writes more into the *same* directory would otherwise read a
 * stale index. Production code never needs it.
 * @returns {void}
 */
export function __resetDiscoveryCache() {
	indexCache.clear();
}

/**
 * Auto-discover components from the docs core ships.
 *
 * Returns an ordered Record where:
 * - Grouped components use the group name as key: `'Button': ['Button', 'IconButton']`
 * - Ungrouped components use their own name as key: `'Avatar': ['Avatar']`
 *
 * Keys are sorted alphabetically (groups and ungrouped components interleaved).
 * Components within each group are also sorted alphabetically.
 * @param {string} coreDir
 * @returns {Record<string, string[]>}
 */
export function discoverComponents(coreDir) {
	const { docs } = coreIndex(coreDir);

	/** @type {Array<{entry: DocEntry, group: string | null}>} */
	const candidates = [];
	/** @type {Map<string, Set<string>>} directory → names its docs hide */
	const hiddenByDir = new Map();

	for (const entry of docs) {
		if (SKIP_DIRS.has(entry.topDir)) continue;
		if (!COMPONENT_NAME_RE.test(entry.name)) continue;
		const meta = readDocMeta(entry.docPath);
		if (meta.hiddenComponents.size > 0) {
			const dir = path.dirname(entry.docPath);
			const set = hiddenByDir.get(dir) ?? new Set();
			for (const name of meta.hiddenComponents) set.add(name);
			hiddenByDir.set(dir, set);
		}
		// A `hidden: true` doc drops just that export. Upstream drops the whole
		// directory because its `hidden` sits on the *directory's* doc; with one
		// doc per export the two statements coincide for a single-export directory
		// and this is the reading that does not silently hide siblings.
		if (meta.hidden) continue;
		candidates.push({ entry, group: meta.group });
	}

	/** @type {Map<string, string|null>} componentName → group */
	const componentGroups = new Map();
	for (const { entry, group } of candidates) {
		if (hiddenByDir.get(path.dirname(entry.docPath))?.has(entry.name)) continue;
		if (!componentGroups.has(entry.name)) componentGroups.set(entry.name, group);
	}

	return groupRecord(componentGroups);
}

/**
 * Fold a `name → group` map into the grouped, alphabetically ordered Record both
 * `discoverComponents` and `discoverExternalComponentsGrouped` return.
 * @param {Map<string, string|null>} componentGroups
 * @returns {Record<string, string[]>}
 */
function groupRecord(componentGroups) {
	/** @type {Map<string, string[]>} */
	const groups = new Map();
	/** @type {string[]} ungrouped component names */
	const ungrouped = [];

	for (const [name, group] of componentGroups) {
		if (group) {
			if (!groups.has(group)) groups.set(group, []);
			groups.get(group)?.push(name);
		} else {
			ungrouped.push(name);
		}
	}

	for (const members of groups.values()) {
		members.sort();
	}

	/** @type {Array<{key: string, values: string[]}>} */
	const entries = [];
	for (const [groupName, members] of groups) {
		entries.push({ key: groupName, values: members });
	}
	for (const name of ungrouped) {
		entries.push({ key: name, values: [name] });
	}
	entries.sort((a, b) => a.key.localeCompare(b.key));

	/** @type {Record<string, string[]>} */
	const ordered = {};
	for (const { key, values } of entries) {
		ordered[key] = values;
	}

	return ordered;
}

/**
 * Find the `.doc.mjs` file for a component.
 *
 * Naming each doc for its export makes the direct case a map lookup where
 * upstream needs four probes. The sub-component fallback is kept: a name that is
 * exported but undocumented resolves to a doc in (or above) its own source
 * directory, exactly as upstream walks up from the source file it found.
 * @param {string} coreDir
 * @param {string} name
 * @returns {string | null}
 */
export function findComponentReadme(coreDir, name) {
	const index = coreIndex(coreDir);
	const direct = index.docsByName.get(name);
	if (direct) return direct;

	const sourcePath = index.sourcesByName.get(name);
	if (!sourcePath) return null;

	const srcLib = path.join(path.resolve(coreDir), 'src', 'lib');
	let dir = path.dirname(sourcePath);
	while (dir.startsWith(srcLib)) {
		for (const doc of index.docs) {
			if (path.dirname(doc.docPath) === dir) return doc.docPath;
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * Find the source module for an export.
 *
 * Upstream matches a filename; this follows the barrel. That is the difference
 * that makes the aliased, mis-cased and relocated exports resolve at all — see
 * the file header. Hooks and other `.svelte.ts` / `.ts` sources come back
 * through the same index as `.svelte` components, so `resolveImportPath` derives
 * a real subpath for them rather than falling back to the package root.
 * @param {string} coreDir
 * @param {string} name
 * @returns {string | null}
 */
export function findComponentSource(coreDir, name) {
	return coreIndex(coreDir).sourcesByName.get(name) ?? null;
}

/**
 * Derive the import specifier for a component.
 *
 * Upstream's two priorities are kept: an exact subpath export matching the name
 * wins (`Theme` → `./theme`), then the subpath matching the source's top-level
 * directory. The one adaptation is which directory that is — upstream measures
 * from `<core>/src`, ours from `<core>/src/lib`, because every source here sits
 * one level deeper and `src` would otherwise always answer `lib`.
 *
 * The bare package root is a *correct* answer here, not a fallback: core
 * publishes one component barrel and eight subpaths, where upstream publishes a
 * subpath per component. `@astryx-svelte/core` is where `Button` actually lives.
 * @param {string} coreDir
 * @param {string} componentName
 * @returns {string}
 */
export function resolveImportPath(coreDir, componentName) {
	const srcLib = path.join(path.resolve(coreDir), 'src', 'lib');
	const pkgPath = path.join(coreDir, 'package.json');
	const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) : null;

	const exportKeys = Object.keys(pkg?.exports || {});

	// Priority 1: exact subpath export matching the component name (e.g. ./theme).
	const exactMatch = exportKeys.find((k) => k.toLowerCase() === `./${componentName}`.toLowerCase());
	if (exactMatch) {
		return `${CORE_PACKAGE}/${exactMatch.slice(2)}`;
	}

	const sourcePath = findComponentSource(coreDir, componentName);
	if (!sourcePath) return CORE_PACKAGE;

	// Priority 2: subpath export matching the top-level source directory.
	const relToSrcLib = path.relative(srcLib, sourcePath);
	const topDir = relToSrcLib.split(path.sep)[0];

	const topMatch = exportKeys.find((k) => k.toLowerCase() === `./${topDir}`.toLowerCase());
	if (topMatch) {
		return `${CORE_PACKAGE}/${topMatch.slice(2)}`;
	}

	return CORE_PACKAGE;
}

// ── External package discovery ───────────────────────────────────────

/**
 * Discover components from an external package's docs directory,
 * reading `group:` fields from each .doc.mjs for subcategories.
 *
 * Returns a Record<string, string[]> matching the shape of discoverComponents():
 * - Grouped components: `{ 'App Chrome': ['AppShell', 'SideNav', 'TopNav'] }`
 * - Ungrouped components: `{ 'Diff': ['Diff'] }`
 * @param {string} docsDir
 * @returns {Record<string, string[]>}
 */
export function discoverExternalComponentsGrouped(docsDir) {
	if (!fs.existsSync(docsDir)) return {};

	/** @type {Map<string, string|null>} componentName → group */
	const componentGroups = new Map();

	/** @param {string} dirPath */
	function scanDir(dirPath) {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			if (WALK_SKIP_DIRS.has(entry.name)) continue;
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				scanDir(fullPath);
			} else if (entry.name.endsWith('.doc.mjs')) {
				const name = entry.name.replace('.doc.mjs', '');
				const { group, hidden } = readDocMeta(fullPath);
				if (!hidden) {
					componentGroups.set(name, group);
				}
			}
		}
	}

	scanDir(docsDir);
	return groupRecord(componentGroups);
}

/**
 * Find a component's doc file in an external package's docs directory.
 * Returns the path to {Name}.doc.mjs or null.
 * @param {string} docsDir
 * @param {string} name
 * @returns {string | null}
 */
export function findExternalComponentDoc(docsDir, name) {
	if (!fs.existsSync(docsDir)) return null;
	const target = `${name}.doc.mjs`;

	/**
	 * @param {string} dirPath
	 * @returns {string | null}
	 */
	function scanDir(dirPath) {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			if (WALK_SKIP_DIRS.has(entry.name)) continue;
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				const found = scanDir(fullPath);
				if (found) return found;
			} else if (entry.name === target) {
				return fullPath;
			}
		}
		return null;
	}

	return scanDir(docsDir);
}

// ── Integration component discovery (ownership-aware) ────────────────
//
// Integration packages contribute a `components` root (resolved absolute path
// in `loadedIntegrations`, see foundation/integrations/integrations.mjs). Each
// component uses a same-stem source/doc convention — e.g. `MetaAppShell.svelte`
// next to `MetaAppShell.doc.{ts,mjs,js}`. The doc file is authoritative for
// discovery; the sibling `.svelte` (if present) is the swizzleable source.
//
// Each discovered component is recorded with its OWNER package (the
// integration's package name) and the owner's `issuesUrl` so downstream
// commands — and the future integration-component swizzle — can disambiguate
// by package and route source/issues correctly.

/**
 * Given an integration component doc path, return the sibling component source
 * (`{Name}.svelte`) if one exists, else null.
 *
 * @param {string} docPath absolute path to a `{Name}.doc.{ts,mjs,js}` file
 * @returns {string|null}
 */
function integrationSourceForDoc(docPath) {
	const dir = path.dirname(docPath);
	const base = path.basename(docPath).replace(/\.doc\.(ts|mjs|js)$/, '');
	const candidate = path.join(dir, `${base}${INTEGRATION_SOURCE_EXT}`);
	return fs.existsSync(candidate) ? candidate : null;
}

/**
 * Discover ownership records for the components contributed by a single loaded
 * integration. Scans the integration's resolved `components` dir for same-stem
 * doc files and records each with owner package + issuesUrl + sourcePath.
 *
 * @param {{name: string, components?: string, issuesUrl?: string}} integration
 *   a single entry from `loadedIntegrations`
 * @returns {Array<{name: string, package: string, docPath: string, sourcePath: string|null, issuesUrl: string|undefined, group: string|null}>}
 */
export function discoverIntegrationComponents(integration) {
	const componentsDir = integration?.components;
	if (!componentsDir || !fs.existsSync(componentsDir)) return [];

	/** @type {Map<string, {name: string, package: string, docPath: string, sourcePath: string|null, issuesUrl: string|undefined, group: string|null}>} */
	const byName = new Map();

	/** @param {string} dirPath */
	function scanDir(dirPath) {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			if (WALK_SKIP_DIRS.has(entry.name)) continue;
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				scanDir(fullPath);
				continue;
			}
			const suffix = INTEGRATION_DOC_SUFFIXES.find((s) => entry.name.endsWith(s));
			if (!suffix) continue;
			const name = entry.name.slice(0, -suffix.length);
			const { group, hidden } = readDocMeta(fullPath);
			if (hidden) continue;
			// First doc wins per name (precedence matches INTEGRATION_DOC_SUFFIXES).
			if (byName.has(name)) continue;
			byName.set(name, {
				name,
				package: integration.name,
				docPath: fullPath,
				sourcePath: integrationSourceForDoc(fullPath),
				issuesUrl: integration.issuesUrl,
				group: group ?? null
			});
		}
	}

	scanDir(componentsDir);
	return [...byName.values()];
}

/**
 * Find an integration component's doc file by name within a loaded
 * integration's resolved `components` dir. Honors the same-stem convention
 * (`{Name}.doc.{ts,mjs,js}`), preferring `.ts` → `.mjs` → `.js`.
 *
 * @param {{components?: string}} integration
 * @param {string} name bare component name
 * @returns {string|null}
 */
export function findIntegrationComponentDoc(integration, name) {
	const componentsDir = integration?.components;
	if (!componentsDir || !fs.existsSync(componentsDir)) return null;

	/**
	 * @param {string} dirPath
	 * @returns {string | null}
	 */
	function scanDir(dirPath) {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		// Exact same-stem match (precedence order) first in this dir. Compared
		// against the listing rather than probed with `existsSync`, which is
		// case-insensitive on Windows and macOS and would hand back a path whose
		// spelling is not the file's — see the note in hook-discovery's findHookDoc.
		const fileNames = new Set(entries.filter((e) => !e.isDirectory()).map((e) => e.name));
		for (const suffix of INTEGRATION_DOC_SUFFIXES) {
			const candidate = `${name}${suffix}`;
			if (fileNames.has(candidate)) return path.join(dirPath, candidate);
		}
		for (const entry of entries) {
			if (WALK_SKIP_DIRS.has(entry.name)) continue;
			if (entry.isDirectory()) {
				const found = scanDir(path.join(dirPath, entry.name));
				if (found) return found;
			}
		}
		return null;
	}

	return scanDir(componentsDir);
}

/**
 * Find an integration component's swizzleable source file (`{Name}.svelte`) by
 * name within a loaded integration's resolved `components` dir. Returns null
 * when the integration ships docs without source.
 *
 * @param {{components?: string}} integration
 * @param {string} name bare component name
 * @returns {string|null}
 */
export function findIntegrationComponentSource(integration, name) {
	const docPath = findIntegrationComponentDoc(integration, name);
	if (!docPath) return null;
	return integrationSourceForDoc(docPath);
}

/**
 * Build a flat list of ownership records for ALL discoverable components —
 * core (built-in) plus every loaded integration. This is the authoritative
 * source for package-aware listing and disambiguation.
 *
 * @param {string} coreDir
 * @param {Array<{name: string, components?: string, issuesUrl?: string}>} [loadedIntegrations]
 * @returns {Array<{name: string, package: string, group: string|null, docPath: string|null, sourcePath: string|null, issuesUrl: string|undefined}>}
 */
export function discoverOwnedComponents(coreDir, loadedIntegrations = []) {
	/** @type {Array<{name: string, package: string, group: string|null, docPath: string|null, sourcePath: string|null, issuesUrl: string|undefined}>} */
	const records = [];

	// Core components — derive group from discoverComponents (grouped record).
	const grouped = discoverComponents(coreDir);
	/** @type {Map<string, string|null>} name → group */
	const coreGroup = new Map();
	for (const [key, members] of Object.entries(grouped)) {
		const isUngrouped = members.length === 1 && members[0] === key;
		for (const name of members) {
			coreGroup.set(name, isUngrouped ? null : key);
		}
	}
	for (const [name, group] of coreGroup) {
		records.push({
			name,
			package: CORE_PACKAGE,
			group,
			docPath: findComponentReadme(coreDir, name),
			sourcePath: findComponentSource(coreDir, name),
			issuesUrl: undefined
		});
	}

	// Integration components.
	for (const integration of loadedIntegrations) {
		for (const rec of discoverIntegrationComponents(integration)) {
			records.push(rec);
		}
	}

	return records;
}
