/**
 * @file Codemod: rename the menu divider *data* types to `*DividerData`
 *
 * Ported from upstream's
 * `assets/codemods/transforms/v0.4.0/rename-menu-divider-data-types.mjs`.
 *
 * Compound menus gained a `DropdownMenuDivider` component (aliased into the
 * ContextMenu and Breadcrumbs surfaces), and TypeScript will not let one barrel
 * re-export a value and a type under one name — `export {X} from 'a'` beside
 * `export {type X} from 'b'` is TS2300, Duplicate identifier. So the bare name
 * now belongs to the component and the data-mode option type takes the `Data`
 * suffix its sibling `DropdownMenuItemData` already carries. In this port that
 * is `src/lib/index.ts` exporting `DropdownMenuDivider` /
 * `ContextMenuDivider` / `BreadcrumbMenuDivider` as components from
 * `dropdown-menu-divider.svelte`, with the option types beside them as
 * `…DividerData`.
 *
 * A stale `import type {DropdownMenuDivider}` fails loudly rather than silently
 * — the name now resolves to a value — so this codemod is about saving the edit,
 * not about catching a silent break.
 *
 * Only unambiguous references are rewritten: a type-only import, or a plain
 * import whose local name is never used as a value in that file. A file that
 * already renders `<DropdownMenuDivider />` is left alone, because there the
 * name means the component.
 *
 * ## What this port's version does that upstream's cannot
 *
 * Upstream is jscodeshift over `.tsx`; this is `magic-string` +
 * `svelte/compiler` (see `run-codemod.mjs`). Two consequences:
 *
 * - **`.svelte` files are in scope.** Upstream's value-usage check is
 *   `root.find(j.JSXIdentifier, {name})` — "is this name rendered as an
 *   element?". The Svelte counterpart is a `Component` node in the markup, which
 *   lives outside the `<script>` the import sits in, so the whole file is walked
 *   before a single decision is made.
 * - **`.ts` / `.js` sources are parsed through a synthetic `<script>` tag**, with
 *   the wrapper's length subtracted back off every offset. A source containing a
 *   literal `</script` is skipped rather than mis-parsed, as elsewhere.
 *
 * The import source check is `@astryx-svelte/core` where upstream's is
 * `@astryxdesign/core`, and it is a **prefix** match for the same reason
 * upstream's is: upstream matches its per-component subpaths
 * (`@astryxdesign/core/DropdownMenu`), and while this port exposes these types
 * only from the root entry point, a prefix match costs nothing and keeps the
 * shape recognisable to anyone reading both.
 */

export const meta = {
	title: 'Rename the menu divider data types to *DividerData',
	description:
		'Renames `DropdownMenuDivider`, `ContextMenuDivider`, and ' +
		'`BreadcrumbMenuDivider` — the `{type: "divider"}` option types — to ' +
		'`DropdownMenuDividerData`, `ContextMenuDividerData`, and ' +
		'`BreadcrumbMenuDividerData`. The bare names now belong to the new ' +
		'compound divider components. Imports used as values are left untouched.'
};

/** @type {Record<string, string>} */
const RENAMES = {
	DropdownMenuDivider: 'DropdownMenuDividerData',
	ContextMenuDivider: 'ContextMenuDividerData',
	BreadcrumbMenuDivider: 'BreadcrumbMenuDividerData'
};

const PACKAGE_PREFIX = '@astryx-svelte/core';

/** Extensions parsed by wrapping the source in a synthetic `<script lang="ts">`. */
const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs'];

const SCRIPT_PREFIX = '<script lang="ts">\n';

/**
 * Parse `source` and return the AST root plus the offset to subtract from every
 * node position to get back to a position in `source`.
 *
 * Duplicated from the sibling transforms rather than shared — a transform is a
 * self-contained unit, as upstream's are.
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
	if (/<\/script/i.test(source)) return null;
	const wrapped = `${SCRIPT_PREFIX}${source}\n</script>`;
	const root = /** @type {any} */ (parseSvelte(wrapped, { modern: true }));
	return { root, offset: SCRIPT_PREFIX.length };
}

/**
 * @param {import('../../../../authoring/codemod/type').AstryxCodemodFile} file
 * @param {import('../../../../authoring/codemod/type').CodemodTransformApi} api
 * @returns {string | null | undefined}
 */
export default function transformer(file, api) {
	const source = file.source;
	if (!Object.keys(RENAMES).some((name) => source.includes(name))) return undefined;

	const parsed = parseAny(source, file.path, api.parseSvelte);
	if (!parsed) return undefined;
	const { root, offset } = parsed;

	/**
	 * Import specifiers that name one of the renamed types.
	 * @type {Array<{spec: any, isTypeOnly: boolean}>}
	 */
	const candidates = [];
	/**
	 * Every `Identifier` occurrence, so a value use can be ruled out after the walk.
	 * @type {Array<{node: any, parent: any}>}
	 */
	const identifiers = [];
	/**
	 * Names rendered as a component in markup — these mean the component.
	 * @type {Set<string>}
	 */
	const componentNames = new Set();
	/**
	 * Type references, so an unaliased rename can follow through to its use sites.
	 * @type {any[]}
	 */
	const typeReferences = [];

	// Pass 1: collect. The markup fragment is walked before the instance script,
	// so nothing can be decided until the whole tree has been seen.
	api.walk(/** @type {any} */ (root), null, {
		ImportDeclaration(node, { next }) {
			if (String(node.source?.value ?? '').startsWith(PACKAGE_PREFIX)) {
				const declarationIsType = node.importKind === 'type';
				for (const spec of node.specifiers ?? []) {
					if (spec.type !== 'ImportSpecifier') continue;
					if (!RENAMES[spec.imported?.name]) continue;
					candidates.push({
						spec,
						isTypeOnly: declarationIsType || spec.importKind === 'type'
					});
				}
			}
			next();
		},
		Identifier(node, { next, path }) {
			identifiers.push({ node, parent: path[path.length - 1] });
			next();
		},
		TSTypeReference(node, { next }) {
			typeReferences.push(node);
			next();
		},
		// Svelte's counterpart to upstream's `JSXIdentifier` check.
		Component(node, { next }) {
			if (typeof node.name === 'string') componentNames.add(node.name);
			next();
		}
	});

	if (candidates.length === 0) return undefined;

	/**
	 * Whether `name` appears anywhere a value — not a type — is expected. The
	 * parent-type switch is upstream's, minus the JSX cases that cannot occur and
	 * plus the markup check above.
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	function isUsedAsValue(name) {
		if (componentNames.has(name)) return true;
		return identifiers.some(({ node, parent }) => {
			if (node.name !== name) return false;
			switch (parent?.type) {
				case 'ImportSpecifier':
				case 'ImportDefaultSpecifier':
				case 'TSTypeReference':
				case 'TSQualifiedName':
				case 'TSTypeAliasDeclaration':
				case 'TSInterfaceDeclaration':
				case 'TSExpressionWithTypeArguments':
					return false;
				case 'ExportSpecifier':
					return parent.exportKind !== 'type';
				default:
					return true;
			}
		});
	}

	const s = new api.magicString(source);
	let hasChanges = false;

	for (const { spec, isTypeOnly } of candidates) {
		const imported = spec.imported.name;
		const renamed = RENAMES[imported];
		const local = spec.local?.name ?? imported;
		const isAliased = local !== imported;

		if (!isTypeOnly && isUsedAsValue(local)) continue;

		// Rewrite the imported name only. An alias keeps its local name, so
		// `{DropdownMenuDivider as MenuRule}` becomes
		// `{DropdownMenuDividerData as MenuRule}` and every use site still reads.
		s.overwrite(spec.imported.start - offset, spec.imported.end - offset, renamed);
		hasChanges = true;

		if (isAliased) continue;

		// Unaliased: the local name changes with it, and so must every type
		// reference to it. `spec.local` shares a range with `spec.imported` when
		// the specifier is shorthand, so only the references are left to do.
		for (const ref of typeReferences) {
			if (ref.typeName?.type !== 'Identifier' || ref.typeName.name !== local) continue;
			s.overwrite(ref.typeName.start - offset, ref.typeName.end - offset, renamed);
		}
	}

	return hasChanges ? s.toString() : undefined;
}
