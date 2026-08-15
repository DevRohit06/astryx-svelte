/**
 * @file Codemod: rename the removed `dropdown-menu-radio-dot` theme target
 *
 * Ported from upstream's
 * `assets/codemods/transforms/v0.4.0/rename-dropdown-menu-radio-dot-target.mjs`
 * (PR #4712).
 *
 * The menu radio's dot is no longer drawn by `DropdownMenuRadioItem`. That row
 * renders the shared radio indicator now, so its dot is the indicator's dot and
 * carries `radio-indicator-dot` (plus the legacy `radio-dot`) instead of the
 * menu-specific `dropdown-menu-radio-dot`, which is gone. In this port that is
 * `radio-indicator.svelte`'s
 * `themeProps('radio-indicator-dot', {size}, {legacyNames: ['radio-dot']})`.
 *
 * Runtime themes are not validated: a theme keyed on the old target keeps
 * compiling and simply stops matching, with no error anywhere. That silence is
 * why this rename needs a codemod rather than a changelog line.
 *
 * The rename is NOT scope-preserving, and that cannot be fixed here — there is
 * no menu-only dot element left to address. `radio-indicator-dot` reaches every
 * radio dot in the app, including RadioList's. So every rewritten site also gets
 * a TODO comment (`api.report` is a stub; comments are the only warning channel)
 * telling the author to check whether the rule was meant to be menu-only.
 *
 * ## What this port's version does that upstream's cannot
 *
 * Upstream is jscodeshift over `.tsx`; this is `magic-string` +
 * `svelte/compiler`, the pair that replaces it (see `run-codemod.mjs`). Upstream
 * rewrites *every* string literal in the file, so in a React consumer it already
 * catches `className="astryx-dropdown-menu-radio-dot"`. The faithful Svelte
 * counterparts of "every string literal" are three places, not one:
 *
 * - **Script literals and template literals**, as upstream. Only `Literal` here,
 *   never babel's `StringLiteral`, because acorn is the parser.
 * - **Markup attribute text** — `class="astryx-dropdown-menu-radio-dot"` is a
 *   `Text` node in Svelte's AST where it is a `StringLiteral` in JSX. Skipping it
 *   would drop the exact case upstream does handle.
 * - **`<style>` blocks**, which have no upstream counterpart at all: a React
 *   consumer's CSS lives in a `.css` file the runner never opens, where a Svelte
 *   consumer's lives in the component. Handled as a plain text replacement over
 *   the stylesheet's source range — the class only ever appears there as
 *   `:global(.astryx-…)`, since `astryx-*` classes are global and Svelte's
 *   scoping would otherwise not match them.
 *
 * Markup **text children** are deliberately not rewritten, which is parity and
 * not an omission: JSX text is `JSXText`, not a `StringLiteral`, so upstream
 * does not touch it either. Only attribute values are in scope.
 *
 * The TODO comment is attached **only in script literals**, which is where
 * upstream attaches it — note that upstream skips it for template literals too.
 * A markup or CSS comment would be splicing a warning into output whose shape
 * this codemod does not otherwise change, so the warning stays where upstream
 * puts it and this paragraph is the record of that.
 */

export const meta = {
	title: 'Rename the removed dropdown-menu-radio-dot theme target',
	description:
		'Renames the `dropdown-menu-radio-dot` theme target (and the ' +
		'`astryx-dropdown-menu-radio-dot` class it rendered) to ' +
		'`radio-indicator-dot` / `astryx-radio-indicator-dot`. Menu radios draw ' +
		'the shared radio indicator now, so the menu-specific dot target no ' +
		'longer exists. The new target is app-wide rather than menu-only, so each ' +
		'rewritten site gets a TODO comment to confirm that widening is intended.',
	pr: '#4712'
};

const OLD_TARGET = 'dropdown-menu-radio-dot';
const NEW_TARGET = 'radio-indicator-dot';
const OLD_CLASS = `astryx-${OLD_TARGET}`;
const NEW_CLASS = `astryx-${NEW_TARGET}`;

const TODO_COMMENT =
	' TODO(astryx upgrade): `dropdown-menu-radio-dot` became `radio-indicator-dot`,' +
	' which styles EVERY radio dot, not just the ones in a menu. If this rule was' +
	' meant to be menu-only, scope it under the containing `dropdown-menu-radio`' +
	' target instead of this one. ';

/** Extensions parsed by wrapping the source in a synthetic `<script lang="ts">`. */
const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs'];

const SCRIPT_PREFIX = '<script lang="ts">\n';

/**
 * Parse `source` and return the AST root plus the offset to subtract from every
 * node position to get back to a position in `source`.
 *
 * Duplicated from `migrate-table-rowexpansion-to-tree.mjs` rather than shared,
 * because a transform is a self-contained unit — upstream's are too, and a
 * shared helper here would be a module a copied transform silently depends on.
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

/**
 * Rewrite one string value, or return null when it holds nothing to rename.
 *
 * Handles the target name on its own (a theme's `components` key) and the
 * rendered class inside a larger string (a selector such as
 * `.astryx-dropdown-menu-radio-dot`, or a class list).
 *
 * The equality check comes first and the surviving `dropdown-menu-radio` target
 * falls through both branches: it is not equal to the dot target, and it does
 * not contain the dot *class*. That is the whole reason the circle's target is
 * left alone.
 *
 * @param {string} value
 * @returns {string | null}
 */
function renameIn(value) {
	if (value === OLD_TARGET) return NEW_TARGET;
	if (value.includes(OLD_CLASS)) return value.split(OLD_CLASS).join(NEW_CLASS);
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
 * @param {import('../../../../authoring/codemod/type').AstryxCodemodFile} file
 * @param {import('../../../../authoring/codemod/type').CodemodTransformApi} api
 * @returns {string | null | undefined}
 */
export default function transformer(file, api) {
	const source = file.source;
	// Cheap bail-out: most files in a consumer repo mention neither name. This
	// also carries idempotency — a second run sees the old name only inside the
	// TODO comment, which is not a node, so nothing matches and nothing changes.
	if (!source.includes(OLD_TARGET)) return undefined;

	const parsed = parseAny(source, file.path, api.parseSvelte);
	if (!parsed) return undefined;
	const { root, offset } = parsed;

	const s = new api.magicString(source);
	let hasChanges = false;

	/** Statement starts that already carry the warning, so it is attached once. */
	const warned = new Set();

	/**
	 * Attach the widening warning to the nearest property, matching where
	 * upstream puts it — a human looks at the property, not at the bare literal.
	 *
	 * @param {any[]} path Ancestors, nearest first.
	 * @param {any} node
	 */
	function attachTodo(path, node) {
		const parent = path[path.length - 1];
		const host = parent && parent.type === 'Property' ? parent : node;
		const at = host.start - offset;
		if (warned.has(at)) return;
		warned.add(at);
		s.appendLeft(at, `/*${TODO_COMMENT}*/\n${indentAt(source, at)}`);
	}

	api.walk(/** @type {any} */ (root), null, {
		// Script strings: `'dropdown-menu-radio-dot'` as a theme key, or the
		// rendered class inside a selector string.
		Literal(node, { next, path }) {
			if (typeof node.value === 'string') {
				const renamed = renameIn(node.value);
				if (renamed != null) {
					// Rewrite inside the quotes so the original quote style survives.
					const raw = typeof node.raw === 'string' ? node.raw : null;
					const quote = raw ? raw[0] : "'";
					s.overwrite(node.start - offset, node.end - offset, `${quote}${renamed}${quote}`);
					attachTodo(path, node);
					hasChanges = true;
				}
			}
			next();
		},
		// Template literals carry the class in CSS strings: `.${OLD_CLASS} > span`.
		// No warning here, as upstream attaches none.
		TemplateElement(node, { next }) {
			const cooked = node.value?.cooked;
			if (typeof cooked === 'string' && cooked.includes(OLD_CLASS)) {
				const raw = node.value.raw.split(OLD_CLASS).join(NEW_CLASS);
				// A TemplateElement's own range excludes the delimiters, so the raw
				// text can be replaced in place.
				s.overwrite(node.start - offset, node.end - offset, raw);
				hasChanges = true;
			}
			next();
		},
		// Markup: `class="astryx-dropdown-menu-radio-dot"`. An attribute's static
		// value is a `Text` node where JSX would give upstream a `StringLiteral`.
		// Reached through `Attribute` rather than by visiting `Text` directly, so
		// that markup *text children* — `JSXText` upstream, which its
		// `StringLiteral` selector does not match — stay out of scope.
		Attribute(node, { next }) {
			if (Array.isArray(node.value)) {
				for (const part of node.value) {
					if (part?.type !== 'Text' || typeof part.data !== 'string') continue;
					if (!part.data.includes(OLD_CLASS)) continue;
					s.overwrite(
						part.start - offset,
						part.end - offset,
						part.data.split(OLD_CLASS).join(NEW_CLASS)
					);
					hasChanges = true;
				}
			}
			next();
		}
	});

	// `<style>` — no upstream counterpart; see the header. Replaced over the
	// stylesheet's source range rather than through the CSS AST, because the only
	// shape that matters is the class name and it is the same string wherever it
	// appears in there.
	const css = /** @type {any} */ (root).css;
	if (css && typeof css.start === 'number' && typeof css.end === 'number') {
		const from = css.start - offset;
		const to = css.end - offset;
		const block = source.slice(from, to);
		if (block.includes(OLD_CLASS)) {
			s.overwrite(from, to, block.split(OLD_CLASS).join(NEW_CLASS));
			hasChanges = true;
		}
	}

	return hasChanges ? s.toString() : undefined;
}
