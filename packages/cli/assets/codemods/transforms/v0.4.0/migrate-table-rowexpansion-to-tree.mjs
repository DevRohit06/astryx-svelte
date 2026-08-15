/**
 * @file Codemod: Migrate tree-mode useTableRowExpansion to the tree plugin
 *
 * Ported from upstream's
 * `assets/codemods/transforms/v0.4.0/migrate-table-rowexpansion-to-tree.mjs`
 * (PR #4612), the migration staged alongside the #4609 rewrite.
 *
 * `useTableRowExpansion` is now a detail-panel plugin (`renderExpanded`). Its
 * old tree mode (child rows that reuse the parent columns) moved to
 * `useTableTreeData` + `useTableTreeState`, and `useTableRowExpansionState` was
 * removed. This rewrites the standard tree pattern:
 *
 *   const expansionState = useTableRowExpansionState(() => ({
 *     baseData, getChildren, getRowKey, expandedKeys, setExpandedKeys
 *   }));
 *   const expansion = useTableRowExpansion(() => expansionState.expansionConfig);
 *   <Table data={expansionState.data} … />
 *
 * into:
 *
 *   const expansionState = useTableTreeState(() => ({
 *     data: baseData, childrenKey: 'children', idKey: getRowKey
 *   }));
 *   const expansion = useTableTreeData(() => expansionState.treeConfig);
 *   <Table data={expansionState.visibleData} … />
 *
 * Files that use the new detail-panel API (`renderExpanded`, no
 * `useTableRowExpansionState` import) are left untouched.
 *
 * ## What this port's version does that upstream's cannot
 *
 * Upstream is jscodeshift over `.tsx`; this is `magic-string` +
 * `svelte/compiler`, the pair that replaces it (see
 * `assets/codemods/run-codemod.mjs`). Three consequences:
 *
 * - **`.svelte` files are in scope**, which is where a Svelte consumer's table
 *   actually lives. Both the `<script>` and the markup are walked, so
 *   `data={state.data}` in a `<Table>` tag is rewritten to `state.visibleData`
 *   in the same pass as the hook call.
 * - **`.ts` / `.js` sources are parsed through a synthetic `<script>` tag**, the
 *   same wrapper `svelte-parser.mjs`'s `checkSyntax` uses, with the wrapper's
 *   length subtracted back off every offset. A source containing a literal
 *   `</script` would close that tag early, so such a file is skipped rather than
 *   mis-parsed — the same fail-safe direction `checkSyntax` takes.
 * - **The result is held, not destructured.** Upstream's hooks return a fresh
 *   object per render, so it renames the members of a destructuring pattern.
 *   This port's return one object for the component's lifetime and expose their
 *   members as **getters**, so destructuring freezes them and the documented
 *   idiom is `state.visibleData`. Both are rewritten: the object pattern (for a
 *   consumer who wrote it anyway) and the member expressions.
 *
 * One thing it does NOT do, exactly as upstream does not: map the controlled
 * `expandedKeys` / `setExpandedKeys` pair onto `expandedIds` /
 * `onExpandedIdsChange`. `useTableTreeState` is uncontrolled by default and the
 * 1:1 mapping is not mechanical, so those two keys are dropped and a three-line
 * `astryx-migration:` comment is attached for a human to finish.
 */

export const meta = {
	title: 'Migrate tree-mode useTableRowExpansion to the tree plugin',
	description:
		'Rewrites the removed useTableRowExpansionState tree pattern to useTableTreeState + useTableTreeData. Detail-panel usage (renderExpanded) is left untouched.',
	pr: '#4612'
};

/**
 * Module specifiers whose `useTableRowExpansionState` is *this* one. Upstream
 * lists four because it ships under two scopes; this port ships one package and
 * exposes these hooks only from its root entry point.
 */
const IMPORT_SOURCES = new Set(['@astryx-svelte/core']);

const STATE_HOOK = 'useTableRowExpansionState';
const PLUGIN_HOOK = 'useTableRowExpansion';
const TREE_STATE_HOOK = 'useTableTreeState';
const TREE_DATA_HOOK = 'useTableTreeData';

/** Extensions parsed by wrapping the source in a synthetic `<script lang="ts">`. */
const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs'];

const SCRIPT_PREFIX = '<script lang="ts">\n';

/**
 * The migration note attached above the rewritten state hook, verbatim from
 * upstream's three `commentLine` calls.
 */
const GUIDANCE = [
	'// astryx-migration: verify tree expansion state. useTableTreeState',
	'// is uncontrolled by default; pass defaultExpandedIds, or',
	'// expandedIds + onExpandedIdsChange for the old controlled set.'
];

/**
 * Parse `source` and return the AST root plus the offset to subtract from every
 * node position to get back to a position in `source`.
 *
 * @param {string} source
 * @param {string} path
 * @param {import('../../../../authoring/codemod/type').SvelteParse} parseSvelte
 * @returns {{root: any, offset: number} | null}
 */
function parseAny(source, path, parseSvelte) {
	if (path.endsWith('.svelte')) {
		return { root: /** @type {any} */ (parseSvelte(source, { modern: true })), offset: 0 };
	}
	if (!SCRIPT_EXTENSIONS.some((ext) => path.endsWith(ext))) return null;
	// A literal `</script` would terminate the synthetic tag early and turn a
	// valid module into a parse error about markup. Skip rather than guess.
	if (/<\/script/i.test(source)) return null;
	const wrapped = `${SCRIPT_PREFIX}${source}\n</script>`;
	const root = /** @type {any} */ (parseSvelte(wrapped, { modern: true }));
	return { root, offset: SCRIPT_PREFIX.length };
}

/** @param {any} prop @returns {string | null} */
function propKeyName(prop) {
	if (!prop || prop.type === 'SpreadElement' || !prop.key) return null;
	if (prop.key.type === 'Identifier') return prop.key.name;
	if (prop.key.type === 'Literal') return String(prop.key.value);
	return null;
}

/**
 * The indentation of the line `index` falls on.
 * @param {string} source
 * @param {number} index
 * @returns {string}
 */
function indentAt(source, index) {
	const lineStart = source.lastIndexOf('\n', index - 1) + 1;
	const match = /^[ \t]*/.exec(source.slice(lineStart, index));
	return match ? match[0] : '';
}

/**
 * Rewrite the state hook's config object, returning its replacement text.
 *
 * Key mapping is upstream's, and so is the `splice(1, 0, …)` position for
 * `childrenKey`: it lands directly after `data`, where the old `getChildren`
 * used to sit.
 *
 * @param {string} source
 * @param {number} offset
 * @param {any} obj ObjectExpression
 * @returns {string}
 */
function rewriteConfigObject(source, offset, obj) {
	/** @param {any} node @returns {string} */
	const text = (node) => source.slice(node.start - offset, node.end - offset);

	/** @type {string[]} */
	const entries = [];
	for (const prop of obj.properties ?? []) {
		const key = propKeyName(prop);
		if (key === null) {
			entries.push(text(prop));
			continue;
		}
		const value = prop.shorthand ? key : text(prop.value);
		if (key === 'baseData') {
			entries.push(`data: ${value}`);
		} else if (key === 'getRowKey') {
			entries.push(`idKey: ${value}`);
		} else if (key === 'getIsItemExpandable') {
			entries.push(`isItemExpandable: ${value}`);
		} else if (key === 'getChildren' || key === 'expandedKeys' || key === 'setExpandedKeys') {
			// `getChildren` becomes the `childrenKey` literal below. The expansion
			// pair is dropped and flagged by the guidance comment — see the header.
			continue;
		} else {
			entries.push(text(prop));
		}
	}

	entries.splice(1, 0, "childrenKey: 'children'");

	const first = obj.properties?.[0];
	const inner = first ? indentAt(source, first.start - offset) : '\t';
	const close = indentAt(source, obj.start - offset);
	if (entries.length === 0) return '{}';
	return `{\n${inner}${entries.join(`,\n${inner}`)}\n${close}}`;
}

/**
 * @param {import('../../../../authoring/codemod/type').AstryxCodemodFile} file
 * @param {import('../../../../authoring/codemod/type').CodemodTransformApi} api
 * @returns {string | null | undefined}
 */
export default function transformer(file, api) {
	const source = file.source;
	// Only act on files importing the removed state hook. Detail-panel-only usage
	// (`useTableRowExpansion` alone) is the new API and must be left alone.
	if (!source.includes(STATE_HOOK)) return undefined;

	const parsed = parseAny(source, file.path, api.parseSvelte);
	if (!parsed) return undefined;
	const { root, offset } = parsed;

	/** @param {any} node @returns {string} */
	const text = (node) => source.slice(node.start - offset, node.end - offset);

	/** @type {string | null} */
	let stateLocal = null;
	/** @type {string | null} */
	let pluginLocal = null;
	/** @type {any[]} */
	const importDecls = [];
	/** @type {any[]} */
	const calls = [];
	/** @type {any[]} */
	const declarations = [];
	/** @type {any[]} */
	const memberExpressions = [];

	// --- Pass 1: collect, edit nothing. Two orderings force this. The markup
	// fragment is walked BEFORE the instance script (it comes first in the AST
	// root), so the result locals a member expression has to be matched against
	// are not known until the walk finishes; and the import's local names are not
	// known when a call node is visited, so calls are matched after the fact.
	api.walk(/** @type {any} */ (root), null, {
		ImportDeclaration(node, { next }) {
			if (IMPORT_SOURCES.has(node.source?.value)) {
				for (const spec of node.specifiers ?? []) {
					if (spec.type !== 'ImportSpecifier') continue;
					if (spec.imported?.name === STATE_HOOK) {
						stateLocal = spec.local?.name ?? spec.imported.name;
						importDecls.push(node);
					}
					if (spec.imported?.name === PLUGIN_HOOK) {
						pluginLocal = spec.local?.name ?? spec.imported.name;
					}
				}
			}
			next();
		},
		VariableDeclaration(node, { next }) {
			declarations.push(node);
			next();
		},
		CallExpression(node, { next }) {
			if (node.callee?.type === 'Identifier') calls.push(node);
			next();
		},
		MemberExpression(node, { next }) {
			memberExpressions.push(node);
			next();
		}
	});

	if (!stateLocal) return undefined;

	/** @param {any} node @returns {boolean} */
	const isStateCall = (node) => node?.type === 'CallExpression' && node.callee?.name === stateLocal;
	const stateCalls = calls.filter(isStateCall);
	const pluginCalls = pluginLocal ? calls.filter((node) => node.callee?.name === pluginLocal) : [];
	if (stateCalls.length === 0) return undefined;

	const s = new api.magicString(source);
	let hasChanges = false;

	/** Names the state hook's result was bound to — `state.visibleData` reads. */
	const resultLocals = new Set();
	/** Ranges replaced wholesale, so a later edit cannot splice inside one. */
	const rewritten = [];

	// --- 1. Rewrite the state hook call + its config object ---
	for (const call of stateCalls) {
		s.overwrite(call.callee.start - offset, call.callee.end - offset, TREE_STATE_HOOK);
		hasChanges = true;

		const arg = call.arguments?.[0];
		if (!arg) continue;
		// Both shapes: this port's getter (`() => ({…})`) and a bare object. The
		// hooks take a getter, so a bare object is wrapped rather than left to fail
		// at the call site.
		const isGetter =
			arg.type === 'ArrowFunctionExpression' && arg.body?.type === 'ObjectExpression';
		const obj = isGetter ? arg.body : arg.type === 'ObjectExpression' ? arg : null;
		if (!obj) continue;

		const replacement = rewriteConfigObject(source, offset, obj);
		if (isGetter) {
			s.overwrite(obj.start - offset, obj.end - offset, replacement);
			rewritten.push([obj.start - offset, obj.end - offset]);
		} else {
			s.overwrite(arg.start - offset, arg.end - offset, `() => (${replacement})`);
			rewritten.push([arg.start - offset, arg.end - offset]);
		}
	}

	// --- 2. Rename what the result is read as ---
	for (const decl of declarations) {
		for (const declarator of decl.declarations ?? []) {
			if (!isStateCall(declarator.init)) continue;

			if (declarator.id?.type === 'Identifier') {
				resultLocals.add(declarator.id.name);
			} else if (declarator.id?.type === 'ObjectPattern') {
				for (const prop of declarator.id.properties ?? []) {
					const key = propKeyName(prop);
					// A destructure is upstream's shape, not this port's — the members
					// are getters here and destructuring freezes them — but a consumer
					// may have written one anyway, so both names are still renamed.
					if (key === 'data') {
						// `{data}` -> `{visibleData: data}`; `{data: rows}` -> `{visibleData: rows}`
						const value = prop.shorthand ? key : text(prop.value);
						s.overwrite(prop.start - offset, prop.end - offset, `visibleData: ${value}`);
						hasChanges = true;
					} else if (key === 'expansionConfig') {
						// `{expansionConfig}` -> `{treeConfig}`, kept shorthand.
						const replacement = prop.shorthand ? 'treeConfig' : `treeConfig: ${text(prop.value)}`;
						s.overwrite(prop.start - offset, prop.end - offset, replacement);
						hasChanges = true;
					}
				}
			}

			// The migration note goes on the statement, so a human confirms the
			// expansion-state wiring the config rewrite could not carry over.
			const stmtIndent = indentAt(source, decl.start - offset);
			s.appendLeft(decl.start - offset, `${GUIDANCE.join(`\n${stmtIndent}`)}\n${stmtIndent}`);
		}
	}

	// --- 3. Swap the plugin call: useTableRowExpansion(cfg) -> useTableTreeData(cfg) ---
	for (const call of pluginCalls) {
		s.overwrite(call.callee.start - offset, call.callee.end - offset, TREE_DATA_HOOK);
		hasChanges = true;
		const arg = call.arguments?.[0];
		if (arg?.type === 'Identifier' && arg.name === 'expansionConfig') {
			s.overwrite(arg.start - offset, arg.end - offset, 'treeConfig');
		}
	}

	// --- 4. `state.data` -> `state.visibleData`, `state.expansionConfig` -> `state.treeConfig` ---
	for (const node of memberExpressions) {
		if (node.computed) continue;
		if (node.object?.type !== 'Identifier' || !resultLocals.has(node.object.name)) continue;
		const name = node.property?.name;
		const next = name === 'data' ? 'visibleData' : name === 'expansionConfig' ? 'treeConfig' : null;
		if (!next) continue;
		const start = node.property.start - offset;
		const end = node.property.end - offset;
		if (rewritten.some(([from, to]) => start >= from && end <= to)) continue;
		s.overwrite(start, end, next);
		hasChanges = true;
	}

	if (!hasChanges) return undefined;

	// --- 5. Fix imports: drop the removed hooks, add the tree hooks ---
	for (const decl of importDecls) {
		// Annotated, not inferred: `decl` is `any`, so `decl.specifiers ?? []` is
		// `any` too, and every `.filter`/`.map` callback below would take an
		// implicitly-any parameter under `checkJs` + `strict`.
		/** @type {any[]} */
		const specs = decl.specifiers ?? [];
		if (specs.length === 0) continue;
		const kept = specs.filter(
			(spec) =>
				!(
					spec.type === 'ImportSpecifier' &&
					(spec.imported?.name === STATE_HOOK || spec.imported?.name === PLUGIN_HOOK)
				)
		);
		const present = new Set(
			kept.map((spec) => (spec.type === 'ImportSpecifier' ? spec.imported?.name : null))
		);
		const names = kept.map((spec) => text(spec));
		if (!present.has(TREE_STATE_HOOK)) names.push(TREE_STATE_HOOK);
		if (!present.has(TREE_DATA_HOOK)) names.push(TREE_DATA_HOOK);
		s.overwrite(specs[0].start - offset, specs[specs.length - 1].end - offset, names.join(', '));
	}

	return s.toString();
}
