/**
 * @file Import-statement plumbing for the expander, and the block-splice seam.
 *
 * A `{hint}` can resolve two ways upstream:
 *   - **import**: an app-registered local component (KpiCard, charts, …) is
 *     imported from its configured path and referenced. This is the bridge that
 *     lets XLE reach the domain components it is otherwise blind to, and it is
 *     the mode this port supports.
 *   - **splice**: a template block (not an importable package) is co-defined as
 *     a *second component in the generated module* and referenced, with its
 *     imports hoisted and merged.
 *
 * ## Why `prepareSpliceModule` is not ported
 *
 * Splice mode has no Svelte analogue and no input here, and both halves of that
 * matter:
 *
 * - **No analogue.** A `.svelte` file is exactly one component. Upstream can
 *   append `function CardCallout() {…}` to the generated module because a TSX
 *   module holds any number of components; Svelte has no in-file second
 *   component, and the nearest constructs (a snippet, a child file) are not the
 *   same thing — a snippet cannot carry its own `<script>`, and a sibling file
 *   is an import, i.e. the *other* mode. Adapting the transform would mean
 *   inventing a mechanism, which the parity rule forbids.
 * - **No input either, for now.** Slice 6 landed `discoverTemplates`, so a
 *   template block *is* discoverable — but only from an external package or an
 *   integration; core's 1,329 block assets are still deferred, so the blocks
 *   upstream splices (`card-callout` and its siblings) do not exist here. That
 *   half will eventually go away; the paragraph above will not.
 *
 * So the expander's splice branch emits upstream's own "source not available"
 * TODO marker instead. The three import helpers
 * below *are* ported: they operate on ES import statements, which a Svelte
 * `<script>` block contains exactly as a TSX module does, and `renderImport` is
 * on the live path for every generated file.
 *
 * Pure (no fs): the Node caller reads files; this only transforms strings.
 *
 * @input  module source text (imports) or a merged import map
 * @output parseImportStatements / mergeImports / renderImport
 * @position foundation/xle — used by expand.mjs
 */

const IMPORT_RE =
	/^import\s+(?:(type)\s+)?(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*))?\s*(?:from\s*)?['"]([^'"]+)['"]\s*;?/;

/**
 * Parse the import statements at the top of a module. Handles named, type,
 * default, namespace, and side-effect imports (incl. simple multiline named
 * lists). Returns {imports, rest} where rest is the source with those import
 * lines removed.
 * @param {string} source
 * @returns {{imports: import('./xle-ast').ParsedImport[], rest: string}}
 */
export function parseImportStatements(source) {
	const lines = source.split('\n');
	/** @type {import('./xle-ast').ParsedImport[]} */
	const imports = [];
	/** @type {string[]} */
	const kept = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^\s*import\b/.test(line)) {
			// Gather a possibly-multiline import up to its terminating quote+;
			let stmt = line;
			while (!/['"]\s*;?\s*$/.test(stmt) && i + 1 < lines.length) {
				i++;
				stmt += '\n' + lines[i];
			}
			const m = stmt.replace(/\s+/g, ' ').match(IMPORT_RE);
			if (m) {
				const [, typeKw, defaultWithNamed, named, namespace, bareDefault, src] = m;
				imports.push({
					source: src,
					isType: Boolean(typeKw),
					default: defaultWithNamed || bareDefault || null,
					namespace: namespace || null,
					named: named
						? named
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean)
						: [],
					sideEffect: !named && !namespace && !bareDefault && !defaultWithNamed
				});
				continue;
			}
		}
		kept.push(line);
	}
	return { imports, rest: kept.join('\n') };
}

/**
 * Merge a parsed import list into an emitter import map.
 * The map is Map<source, {named:Set, types:Set, default?:string, namespace?:string, sideEffect?:bool}>.
 * @param {Map<string, import('./xle-ast').ImportEntry>} map
 * @param {import('./xle-ast').ParsedImport[]} imports
 */
export function mergeImports(map, imports) {
	for (const imp of imports) {
		if (!map.has(imp.source)) {
			map.set(imp.source, {
				named: new Set(),
				types: new Set(),
				default: null,
				namespace: null,
				sideEffect: false
			});
		}
		const entry = map.get(imp.source);
		if (!entry) continue;
		if (imp.sideEffect) entry.sideEffect = true;
		if (imp.default) entry.default = imp.default;
		if (imp.namespace) entry.namespace = imp.namespace;
		for (const n of imp.named) (imp.isType ? entry.types : entry.named).add(n);
	}
}

/**
 * Render one merged import entry to a statement string.
 * @param {string} source
 * @param {import('./xle-ast').ImportEntry} entry
 * @returns {string}
 */
export function renderImport(source, entry) {
	if (
		entry.sideEffect &&
		!entry.default &&
		!entry.namespace &&
		entry.named.size === 0 &&
		entry.types.size === 0
	) {
		return `import '${source}';`;
	}
	/** @type {string[]} */
	const clauses = [];
	if (entry.default) clauses.push(entry.default);
	if (entry.namespace) clauses.push(`* as ${entry.namespace}`);
	const named = [...entry.named].sort();
	const types = [...entry.types].sort();
	// Keep value and type names in one braces group (TS allows inline `type`,
	// and the generated `<script>` is `lang="ts"`).
	const braced = [...named, ...types.map((t) => `type ${t}`)];
	if (braced.length > 0) clauses.push(`{${braced.join(', ')}}`);
	return `import ${clauses.join(', ')} from '${source}';`;
}
