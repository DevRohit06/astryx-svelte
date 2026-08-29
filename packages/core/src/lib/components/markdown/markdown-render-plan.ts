import type { BlockNode, InlineNode } from './parser.js';
import type { MarkdownInlinePlugin, MarkdownSource } from './markdown-types.js';

/**
 * The pre-render walk, and the one structural translation this component needed.
 *
 * Upstream threads a **mutable cursor** through `renderInline` / `renderBlock`,
 * incrementing `cursor.offset` as each node is turned into an element, and
 * assigns citation numbers the same way — `getCitationNumber` mutates a map in
 * encounter order. Both work because React renders a tree in one synchronous
 * top-to-bottom pass.
 *
 * Svelte has no such pass. Snippets are evaluated lazily and independently, and
 * a `$derived` may re-run on its own schedule, so a cursor mutated from markup
 * would hand a node a different offset on a re-render than it had on the first —
 * the fade spans would jump. So the walk runs **once, before rendering**, in
 * exactly upstream's traversal order, and records what each node needs:
 *
 * - text nodes get their inline-plugin split plus a cursor offset per segment
 * - citation nodes get their sequential display number
 *
 * The template then reads the plan and renders. This is the same move
 * `CodeBlock` made for `renderLines`/`buildSpanLine`: the node-returning helper
 * becomes a data-returning one, and the markup does the rendering.
 *
 * Everything here is pure. Keyed by node identity, which is safe because the
 * parser mints a fresh object per node and the plan is rebuilt whenever the AST
 * is.
 */

// ---------------------------------------------------------------------------
// URL sanitization — block dangerous protocols
// ---------------------------------------------------------------------------

/**
 * Upstream's `isSafeUrl` (`Markdown/parser.ts`), predicate for predicate.
 *
 * Two things here are load-bearing, and both were wrong on this side until the
 * 0.5.0 pin was tracked:
 *
 * 1. **Control characters are stripped before the scheme is read.** A bare
 *    `/^javascript:/` never matches `java\u0000script:alert(1)` — the very
 *    shape browsers tolerate and execute — so the normalisation *is* the guard,
 *    not tidying ahead of it. This port had only a `trim()`.
 * 2. **Only `data:text/html` is rejected, not every `data:` URL.** Blocking the
 *    whole scheme also blocks `data:image/*`, an ordinary inline image that
 *    renders upstream. Over-blocking is a parity defect like any other.
 *
 * This port applies the predicate at render, where upstream applies it in
 * `parseInline` — upstream never mints the node, we neutralise it. The rendered
 * output is the same either way.
 */
function isSafeUrl(url: string): boolean {
	// Trim and collapse whitespace/control chars that browsers tolerate but
	// could bypass a naive prefix check (e.g. 'java\nscript:alert(1)').
	// eslint-disable-next-line no-control-regex -- control chars are the bypass
	const normalized = url.replace(/[\x00-\x1f\x7f]/g, '').trim();
	const lower = normalized.toLowerCase();
	if (
		lower.startsWith('javascript:') ||
		lower.startsWith('vbscript:') ||
		lower.startsWith('data:text/html')
	) {
		return false;
	}
	return true;
}

export function sanitizeUrl(url: string): string | null {
	const trimmed = url.trim();
	if (trimmed.length === 0) {
		return null;
	}
	if (!isSafeUrl(trimmed)) {
		return null;
	}
	return trimmed;
}

// ---------------------------------------------------------------------------
// Duration parsing
// ---------------------------------------------------------------------------

/** Parse a CSS duration string (e.g. "175ms", "0.15s") to milliseconds. */
export function parseDuration(value: string): number | null {
	const ms = value.match(/^([\d.]+)ms$/);
	if (ms) {
		return parseFloat(ms[1]);
	}
	const s = value.match(/^([\d.]+)s$/);
	if (s) {
		return parseFloat(s[1]) * 1000;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Text length counting
// ---------------------------------------------------------------------------

/**
 * Count the total text characters in inline nodes without rendering.
 * Used to advance the cursor past a block that will be faded as a whole unit.
 */
export function countInlineTextLength(nodes: InlineNode[]): number {
	let len = 0;
	for (const node of nodes) {
		switch (node.type) {
			case 'text':
				len += node.content.length;
				break;
			case 'code':
				len += node.content.length;
				break;
			case 'image':
				len += node.alt.length;
				break;
			case 'bold':
			case 'italic':
			case 'strikethrough':
			case 'link':
				len += countInlineTextLength(node.children);
				break;
			case 'break':
				len += 1;
				break;
			case 'citation':
				len += 1;
				break;
		}
	}
	return len;
}

/** Count total text characters in a block node tree. */
export function countBlockTextLength(nodes: BlockNode[]): number {
	let len = 0;
	for (const node of nodes) {
		switch (node.type) {
			case 'heading':
			case 'paragraph':
				len += countInlineTextLength(node.children);
				break;
			case 'codeblock':
				len += node.content.length;
				break;
			case 'blockquote':
				len += countBlockTextLength(node.children);
				break;
			case 'list':
				for (const item of node.items) {
					len += countBlockTextLength(item.children);
				}
				break;
			case 'table':
				for (const h of node.headers) {
					len += countInlineTextLength(h.children);
				}
				for (const row of node.rows) {
					for (const cell of row) {
						len += countInlineTextLength(cell.children);
					}
				}
				break;
			case 'hr':
				break;
			case 'image':
				len += node.alt.length;
				break;
		}
	}
	return len;
}

/**
 * Compute per-column min-widths from table AST content.
 * Buckets: ≤6 chars → 60px, 7–15 → 80px, >15 → 120px.
 */
export function computeTableColumnMinWidths(node: {
	headers: { children: InlineNode[] }[];
	rows: { children: InlineNode[] }[][];
}): number[] {
	return node.headers.map((h, colIdx) => {
		let maxLen = countInlineTextLength(h.children);
		for (const row of node.rows) {
			if (row[colIdx]) {
				const len = countInlineTextLength(row[colIdx].children);
				if (len > maxLen) {
					maxLen = len;
				}
			}
		}
		return maxLen <= 6 ? 60 : maxLen <= 15 ? 80 : 120;
	});
}

// ---------------------------------------------------------------------------
// Inline plugin matching
// ---------------------------------------------------------------------------

type InlinePluginSegment =
	| { type: 'text'; content: string }
	| { type: 'plugin'; plugin: MarkdownInlinePlugin; match: RegExpMatchArray; matchLength: number };

/**
 * Find all plugin matches in a text string and split it into segments
 * of plain text and plugin-rendered elements.
 *
 * Algorithm mirrors `findMatches` in `useLinkify`:
 * 1. Run each plugin's regex against the text
 * 2. Check getEndIndex if provided (default: match.index + match[0].length)
 * 3. If getEndIndex returns false, skip the match
 * 4. Collect all non-overlapping matches, sorted by start (first match wins)
 * 5. Split into text/plugin segments
 */
function applyInlinePlugins(text: string, plugins: MarkdownInlinePlugin[]): InlinePluginSegment[] {
	interface RawMatch {
		start: number;
		end: number;
		match: RegExpMatchArray;
		plugin: MarkdownInlinePlugin;
	}

	const allMatches: RawMatch[] = [];

	for (const plugin of plugins) {
		// Reset lastIndex instead of cloning — avoids allocation per call.
		// Safe because text nodes are processed sequentially (no interleaving).
		plugin.pattern.lastIndex = 0;
		let m: RegExpExecArray | null;

		while ((m = plugin.pattern.exec(text)) !== null) {
			let end: number;
			if (plugin.getEndIndex) {
				const result = plugin.getEndIndex(text, m);
				if (result === false) {
					continue;
				}
				end = result;
			} else {
				end = m.index + m[0].length;
			}

			allMatches.push({
				start: m.index,
				end,
				match: m,
				plugin
			});
		}
	}

	// Sort by start position (stable sort preserves plugin order for same position)
	allMatches.sort((a, b) => a.start - b.start);

	// Remove overlapping matches (first wins)
	const resolved: RawMatch[] = [];
	let lastEnd = 0;
	for (const m of allMatches) {
		if (m.start >= lastEnd) {
			resolved.push(m);
			lastEnd = m.end;
		}
	}

	if (resolved.length === 0) {
		return [{ type: 'text', content: text }];
	}

	const segments: InlinePluginSegment[] = [];
	let cursor = 0;

	for (let i = 0; i < resolved.length; i++) {
		const m = resolved[i];

		// Text before this match
		if (m.start > cursor) {
			segments.push({ type: 'text', content: text.slice(cursor, m.start) });
		}

		// Plugin element
		segments.push({
			type: 'plugin',
			plugin: m.plugin,
			match: m.match,
			matchLength: m.end - m.start
		});

		cursor = m.end;
	}

	// Remaining text
	if (cursor < text.length) {
		segments.push({ type: 'text', content: text.slice(cursor) });
	}

	return segments;
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

/** One renderable piece of a text node. */
export type TextRenderSegment =
	| {
			kind: 'text';
			/** The characters to render. */
			content: string;
			/** Cursor offset at the first character — what the fade split needs. */
			offset: number;
			/** The key `computeSegments` derives its span keys from. */
			fadeKey: string;
			/** Stable `{#each}` key. */
			key: string;
	  }
	| {
			kind: 'plugin';
			plugin: MarkdownInlinePlugin;
			match: RegExpMatchArray;
			/** The key handed to the plugin's `render` snippet. */
			renderKey: string;
			/** Stable `{#each}` key. */
			key: string;
	  };

export interface MarkdownRenderPlan {
	/** Segments for every `text` inline node, keyed by node identity. */
	text: Map<InlineNode, TextRenderSegment[]>;
	/** Display number for every `citation` inline node, keyed by node identity. */
	citationNumber: Map<InlineNode, number>;
}

interface PlanState {
	offset: number;
	plugins: MarkdownInlinePlugin[] | undefined;
	sources: Record<string, MarkdownSource> | undefined;
	numberMap: Map<string, number>;
	nextNumber: number;
	plan: MarkdownRenderPlan;
}

function planText(node: InlineNode & { type: 'text' }, index: number, state: PlanState): void {
	const segments: TextRenderSegment[] = [];

	if (state.plugins && state.plugins.length > 0) {
		const split = applyInlinePlugins(node.content, state.plugins);
		// O(1) guard, upstream's: `applyInlinePlugins` returns a single text
		// segment when nothing matched, so the plugin path is skipped entirely
		// in that case and the node keeps its plain `index` key.
		if (!(split.length === 1 && split[0].type === 'text')) {
			for (let i = 0; i < split.length; i++) {
				const seg = split[i];
				if (seg.type === 'text') {
					segments.push({
						kind: 'text',
						content: seg.content,
						offset: state.offset,
						fadeKey: `${index}-seg-${i}`,
						key: `text-${index}-${i}`
					});
					state.offset += seg.content.length;
				} else {
					// Plugin segment — advance cursor by matchLength
					state.offset += seg.matchLength;
					segments.push({
						kind: 'plugin',
						plugin: seg.plugin,
						match: seg.match,
						renderKey: `plugin-${i}`,
						key: `plugin-${index}-${i}`
					});
				}
			}
			state.plan.text.set(node, segments);
			return;
		}
	}

	segments.push({
		kind: 'text',
		content: node.content,
		offset: state.offset,
		fadeKey: String(index),
		key: `text-${index}`
	});
	state.offset += node.content.length;
	state.plan.text.set(node, segments);
}

function planInline(nodes: InlineNode[], state: PlanState): void {
	for (let index = 0; index < nodes.length; index++) {
		const node = nodes[index];
		switch (node.type) {
			case 'text':
				planText(node, index, state);
				break;
			case 'bold':
			case 'italic':
			case 'strikethrough':
				planInline(node.children, state);
				break;
			case 'code':
				// Track code content length for cursor but don't split inside code
				state.offset += node.content.length;
				break;
			case 'link':
				// Both the safe and the unsafe-URL branch render the children, so
				// the walk is the same either way.
				planInline(node.children, state);
				break;
			case 'image':
				// Upstream's `renderInline` advances the cursor for every node type
				// except this one — `countInlineTextLength` does count `alt`, and the
				// two disagree. Replicated: the renderer is what the cursor has to
				// agree with.
				break;
			case 'break':
				state.offset += 1;
				break;
			case 'citation': {
				state.offset += 1;
				if (state.sources) {
					let num = state.numberMap.get(node.sourceId);
					if (num == null) {
						num = state.nextNumber++;
						state.numberMap.set(node.sourceId, num);
					}
					state.plan.citationNumber.set(node, num);
				}
				break;
			}
		}
	}
}

function planBlocks(nodes: BlockNode[], state: PlanState): void {
	for (const node of nodes) {
		switch (node.type) {
			case 'heading':
			case 'paragraph':
				planInline(node.children, state);
				break;
			case 'codeblock':
				// Track codeblock content in cursor for accurate character counting
				state.offset += node.content.length;
				break;
			case 'blockquote':
				planBlocks(node.children, state);
				break;
			case 'list':
				for (const item of node.items) {
					const firstChild = item.children[0];
					const isInline = item.children.length === 1 && firstChild?.type === 'paragraph';
					if (isInline && firstChild.type === 'paragraph') {
						planInline(firstChild.children, state);
					} else {
						planBlocks(item.children, state);
					}
				}
				break;
			case 'table':
				for (const h of node.headers) {
					planInline(h.children, state);
				}
				for (const row of node.rows) {
					for (const cell of row) {
						planInline(cell.children, state);
					}
				}
				break;
			case 'hr':
				break;
			case 'image':
				break;
		}
	}
}

/**
 * Walk the parsed tree in render order and produce everything the template
 * needs that upstream computes *during* the render.
 */
export function buildRenderPlan(
	blocks: BlockNode[],
	inlineNodes: InlineNode[],
	plugins: MarkdownInlinePlugin[] | undefined,
	sources: Record<string, MarkdownSource> | undefined
): MarkdownRenderPlan {
	const state: PlanState = {
		offset: 0,
		plugins,
		sources,
		numberMap: new Map(),
		nextNumber: 1,
		plan: { text: new Map(), citationNumber: new Map() }
	};

	// One of the two is always empty: `display: 'inline'` parses inline nodes
	// and no blocks, everything else the reverse.
	planInline(inlineNodes, state);
	planBlocks(blocks, state);

	return state.plan;
}
