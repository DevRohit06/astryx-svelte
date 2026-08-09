/**
 * @file `template.skeleton` leaf — a layout skeleton (structural tags with
 * spatial annotations) plus the components a resolved template composes.
 *
 * @position api/template/skeleton — derives a compact layout reference from the
 *   resolved match's source; the template dispatcher routes `--skeleton` here.
 *
 * ## This leaf is rewritten, not translated — and that is forced
 *
 * Upstream's `extractSkeleton` is a **line scanner over TSX**. It finds
 * `export default function`, then `return (`, and from there reads each trimmed
 * line as either an opening tag, a closing tag, a slot prop or a styled `div`,
 * tracking indentation with a hand-run depth stack. Every one of those anchors
 * is a React-module shape:
 *
 * - a `.svelte` file has **no wrapper function and no `return (`** — the markup
 *   is the top level of the file, so the scanner would never start capturing;
 * - slots are `{#snippet header()}` blocks, not `header={…}` props;
 * - `{#if}` / `{#each}` open and close lines the tag regexes do not model, and
 *   the depth stack would drift on every one of them;
 * - a multi-line opening tag is stitched together with a 12-line lookahead,
 *   which is exactly the kind of guess an AST does not have to make.
 *
 * So the walk is `svelte/compiler`'s own parser. Everything **observable** is
 * upstream's and unchanged: the `STRUCTURAL` set, the `SPATIAL_PROPS`
 * allowlist and its order, the "VStack/HStack with no spatial props is
 * transparent" rule, the slot-comment vocabulary, the styled-`div`
 * annotation, the 35-line cap and the trailing `...`. Only the way the tags are
 * *found* changed, and it changed from a heuristic to a parse.
 *
 * Two consequences worth knowing:
 *
 * - **A spatial prop is copied verbatim from the source** — `attr.start` to
 *   `attr.end` — so `columns={{minWidth: 200}}` survives byte for byte without
 *   upstream's quote/brace matcher. That matcher exists only because a regex
 *   cannot find the end of an expression; the parser already knows.
 * - **`<Card></Card>` renders as `<Card />`.** Upstream keys "self-closing" off
 *   a literal `/>` in the tag text, so an explicitly-empty element opens a
 *   depth its closing line then fails to pop. Emptiness is the property the
 *   line is really about, and the AST reports it directly.
 *
 * `svelte` is an **optional peer dependency** and the import is dynamic, so it
 * is required only by `--skeleton`. A static import would make `svelte`
 * mandatory for the whole CLI: `api/template/` is on the import path of
 * `search`, `layout`, `component`, `Project` and `validate-integration`.
 */

import * as fs from 'node:fs';
import { AstryxError } from '../../error.mjs';
import { ERROR_CODES } from '../../../foundation/response/error-codes.mjs';
import { extractComponents } from '../_adapter.mjs';

const STRUCTURAL = new Set([
	'AppShell',
	'Layout',
	'LayoutHeader',
	'LayoutContent',
	'LayoutPanel',
	'LayoutFooter',
	'Card',
	'Section',
	'Grid',
	'GridSpan',
	'List',
	'Table',
	'TabList',
	'Toolbar',
	'SideNav',
	'TopNav',
	'Dialog',
	'FormLayout',
	'Center'
]);

const SPATIAL_PROPS = [
	'padding',
	'contentPadding',
	'gap',
	'rowGap',
	'columnGap',
	'columns',
	'hasDivider',
	'defaultHasDividers',
	'variant',
	'density',
	'role',
	'height',
	'width',
	'maxWidth'
];

/**
 * The named slots upstream annotates. Upstream matches them as JSX props
 * (`header={…}`); the same names are snippet blocks here, which is how a Svelte
 * component receives the identical slot.
 */
const SLOT_NAMES = new Set(['header', 'content', 'footer', 'start', 'end', 'sideNav', 'topNav']);

const MAX_LINES = 35;

/**
 * Styled-`div` annotations, in upstream's emit order. Upstream reads a JS style
 * object (`style={{maxWidth: 960}}`); a Svelte `div` carries CSS, so the
 * patterns are the CSS spellings and the **labels stay upstream's** so the
 * annotation vocabulary is unchanged.
 * @type {Array<[string, RegExp]>}
 */
const DIV_STYLE_PATTERNS = [
	['padding', /(?:^|[\s;])padding(?:-[\w-]+)?\s*:\s*([^;"'}]+)/],
	['maxWidth', /(?:^|[\s;])max-width\s*:\s*([^;"'}]+)/],
	['gap', /(?:^|[\s;])(?:row-|column-)?gap\s*:\s*([^;"'}]+)/],
	['margin', /(?:^|[\s;])margin\s*:\s*([^;"'}]+)/],
	['marginInline', /(?:^|[\s;])margin-inline\s*:\s*([^;"'}]+)/]
];

/** @type {((source: string, options: {modern: true}) => any) | undefined} */
let cachedParse;

/**
 * Resolve `svelte/compiler`'s parser, or explain why the view is unavailable.
 * `svelte` is an optional peer: it is present in every project this CLI is for,
 * and absent in a bare `npx` run before `init`.
 * @returns {Promise<(source: string, options: {modern: true}) => any>}
 */
async function loadSvelteParse() {
	if (cachedParse) return cachedParse;
	try {
		const mod = await import('svelte/compiler');
		cachedParse = /** @type {any} */ (mod).parse;
	} catch {
		throw new AstryxError(
			'--skeleton reads the template with the Svelte compiler, and `svelte` could not be ' +
				'resolved from this project. Install it (npm install -D svelte) and re-run, or use ' +
				'`astryx-svelte template <name>` to print the source instead.',
			undefined,
			ERROR_CODES.ERR_DEP_MISSING
		);
	}
	return /** @type {(source: string, options: {modern: true}) => any} */ (cachedParse);
}

/**
 * Every child fragment of an AST node, whatever its shape: elements and
 * components carry `fragment`, a snippet carries `body`, and the control-flow
 * blocks carry one branch per outcome. Reading them by name keeps `{#if}` /
 * `{#each}` / `{#await}` transparent — upstream's scanner has no analogue for
 * them at all, so passing straight through is what matches its output.
 * @param {any} node
 * @returns {any[]}
 */
function childNodes(node) {
	/** @type {any[]} */
	const nodes = [];
	for (const key of [
		'fragment',
		'body',
		'consequent',
		'alternate',
		'fallback',
		'pending',
		'then',
		'catch'
	]) {
		const value = node?.[key];
		if (value && value.type === 'Fragment' && Array.isArray(value.nodes))
			nodes.push(...value.nodes);
	}
	return nodes;
}

/**
 * Children that would produce a line: whitespace and comments are not content
 * for the purposes of "is this tag empty?".
 * @param {any} node
 * @returns {any[]}
 */
function meaningfulChildren(node) {
	return childNodes(node).filter((child) => {
		if (child.type === 'Comment') return false;
		if (child.type === 'Text') return child.data != null && String(child.data).trim() !== '';
		return true;
	});
}

/**
 * The allowlisted spatial props on a node, copied verbatim from the source in
 * `SPATIAL_PROPS` order (upstream's order, which is the emit order).
 * @param {any} node
 * @param {string} source
 * @returns {string[]}
 */
function extractSpatialAttrs(node, source) {
	/** @type {string[]} */
	const attrs = [];
	const declared = /** @type {any[]} */ (node.attributes ?? []);
	for (const name of SPATIAL_PROPS) {
		const attr = declared.find((a) => a.type === 'Attribute' && a.name === name);
		if (attr) attrs.push(source.slice(attr.start, attr.end).trim());
	}
	return attrs;
}

/**
 * The value side of `name="…"` / `name='…'` / `name={…}`, or null for a
 * valueless attribute. Taking the *value* rather than the whole slice matters
 * for the patterns below: they anchor each declaration on a start-or-separator
 * boundary, and the opening quote is neither.
 * @param {string} raw the attribute's verbatim source slice
 * @returns {string | null}
 */
function attributeValueText(raw) {
	const m = raw.match(/^[^=]+=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*)\}|([^\s/>]+))/);
	if (!m) return null;
	return (m[1] ?? m[2] ?? m[3] ?? m[4] ?? '').trim();
}

/**
 * The CSS a `div` declares, as one `prop: value; prop: value` string — from its
 * `style` attribute and any `style:` directives, which are the two ways a
 * Svelte element carries inline style.
 * @param {any} node
 * @param {string} source
 * @returns {string}
 */
function divStyleText(node, source) {
	/** @type {string[]} */
	const parts = [];
	for (const attr of /** @type {any[]} */ (node.attributes ?? [])) {
		if (attr.type === 'Attribute' && attr.name === 'style') {
			const value = attributeValueText(source.slice(attr.start, attr.end));
			if (value) parts.push(value);
		} else if (attr.type === 'StyleDirective') {
			const value = attributeValueText(source.slice(attr.start, attr.end));
			parts.push(`${attr.name}: ${value ?? 'true'}`);
		}
	}
	return parts.join('; ');
}

/**
 * Derive the layout skeleton from a template's Svelte source.
 * @param {string} source
 * @param {(source: string, options: {modern: true}) => any} parse
 * @returns {string}
 */
function extractSkeleton(source, parse) {
	/** @type {any} */
	let ast;
	try {
		ast = parse(source, { modern: true });
	} catch (err) {
		// There is no frozen error code for "a template's source does not parse",
		// and ERROR_CODES is append-only and pinned at 43 by its own suite — so
		// the documented fallback is the correct one rather than a 44th entry.
		throw new AstryxError(
			`Template source could not be parsed: ${/** @type {any} */ (err).message}`,
			undefined,
			ERROR_CODES.ERR_UNKNOWN
		);
	}

	/** @type {string[]} */
	const out = [];
	let truncated = false;

	/** @param {number} depth @param {string} line */
	const push = (depth, line) => {
		if (out.length >= MAX_LINES) {
			if (!truncated) {
				out.push('  '.repeat(depth) + '...');
				truncated = true;
			}
			return;
		}
		out.push(line);
	};

	/** @param {any[]} nodes @param {number} depth */
	const walk = (nodes, depth) => {
		for (const node of nodes) {
			switch (node.type) {
				case 'Component':
				case 'SvelteComponent':
				case 'SvelteSelf':
					visitComponent(node, depth);
					break;
				case 'RegularElement':
					if (node.name === 'div') visitDiv(node, depth);
					walk(childNodes(node), depth);
					break;
				case 'SnippetBlock': {
					const name = node.expression?.name;
					if (name && SLOT_NAMES.has(name)) push(depth, '  '.repeat(depth) + `/* ${name}: */`);
					walk(childNodes(node), depth);
					break;
				}
				default:
					walk(childNodes(node), depth);
			}
		}
	};

	/** @param {any} node @param {number} depth */
	const visitComponent = (node, depth) => {
		// `XDS` input leniency, the same allowance `foundation/xle/registry-core`
		// makes: nothing in this port emits the prefix, but a template adapted
		// from upstream's docs can carry it.
		const comp = String(node.name).replace(/^XDS/, '');
		const props = extractSpatialAttrs(node, source);
		const hasSpatialProps = props.length > 0;
		const propStr = hasSpatialProps ? ' ' + props.join(' ') : '';
		const isStack = comp === 'VStack' || comp === 'HStack';
		const children = meaningfulChildren(node);

		// A bare stack is layout plumbing with nothing to say; its children stay
		// at the parent's depth, exactly as upstream's `continue` leaves them.
		if (isStack && !hasSpatialProps) {
			walk(children, depth);
			return;
		}

		if (children.length === 0) {
			push(depth, '  '.repeat(depth) + `<${comp}${propStr} />`);
			return;
		}

		if (STRUCTURAL.has(comp) || (isStack && hasSpatialProps)) {
			push(depth, '  '.repeat(depth) + `<${comp}${propStr}>`);
			walk(children, depth + 1);
			push(depth, '  '.repeat(depth) + `</${comp}>`);
			return;
		}

		// Non-structural with content: upstream emits the self-closed form and
		// keeps reading the following lines at the same depth.
		push(depth, '  '.repeat(depth) + `<${comp}${propStr} />`);
		walk(children, depth);
	};

	/** @param {any} node @param {number} depth */
	const visitDiv = (node, depth) => {
		const styleText = divStyleText(node, source);
		if (!styleText) return;
		/** @type {string[]} */
		const styleProps = [];
		for (const [label, pattern] of DIV_STYLE_PATTERNS) {
			const m = styleText.match(pattern);
			if (m) styleProps.push(`${label}: ${m[1].trim()}`);
		}
		if (styleProps.length > 0) {
			push(depth, '  '.repeat(depth) + `/* div: ${styleProps.join(', ')} */`);
		}
	};

	walk(ast.fragment?.nodes ?? [], 0);

	return out.filter((l) => l.trim()).join('\n');
}

/**
 * Build the `template.skeleton` envelope for an already-resolved template.
 * `match` may be undefined when `--skeleton` is run without a name — the same
 * "specify a template name" error the dispatcher's resolution would surface.
 * @param {import('../_adapter.mjs').DiscoveredTemplate | undefined} match
 * @param {import('../_adapter.mjs').DiscoveredTemplate[]} templates
 * @returns {Promise<import('../template.type.mjs').TemplateSkeletonResponse>}
 */
export async function templateSkeleton(match, templates) {
	if (!match) {
		throw new AstryxError(
			'Specify a template name for --skeleton',
			templates.map((t) => ({ name: t.dirName, reason: `${t.type} template` })),
			ERROR_CODES.ERR_UNKNOWN_TEMPLATE
		);
	}
	if (!fs.existsSync(match.filePath)) {
		throw new AstryxError(
			`No source file found for template "${match.dirName}"`,
			undefined,
			ERROR_CODES.ERR_NO_SOURCE
		);
	}
	const parse = await loadSvelteParse();
	const src = fs.readFileSync(match.filePath, 'utf-8');
	return {
		type: 'template.skeleton',
		data: {
			template: match.dirName,
			description: match.description,
			components: extractComponents(match.filePath),
			skeleton: extractSkeleton(src, parse)
		}
	};
}
