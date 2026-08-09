import type { ContentBlock, ReferenceSection } from '$lib/generated/types.js';
import type { OutlineEntry } from './outline.svelte';
import { sectionId } from './section-id.js';

/**
 * Ported from the docsite's `ReferenceDocView.buildOutline`.
 *
 * A `heading` content block (0.2.0's sixth block type) gets its own outline
 * entry at its own level, nested under the section it sits in — the half of that
 * feature this port had left open while `DocPageLayout`'s outline items were
 * flat `{id, label}`.
 *
 * The ids have to be minted here and consumed by the page, because they are
 * deduped across the whole document: two sections can hold a heading with the
 * same text, and every outline link must resolve to exactly one element. The
 * page therefore reads `blockIds` rather than re-deriving a slug, which is the
 * same reason `sectionId` is shared rather than inlined.
 */

/** Upstream's `normalizeHeadingLevel`. */
function normalizeHeadingLevel(level: number | undefined): 3 | 4 | 5 | 6 {
	return level === 4 || level === 5 || level === 6 ? level : 3;
}

/**
 * Upstream's `uniqueSlug`. Note it slugifies with `sectionId` here — upstream
 * calls its own `slugify`, and the two agree on the shape a section id takes,
 * which is what keeps a section's anchor unchanged by this change.
 */
function uniqueSlug(value: string, seen: Map<string, number>, fallback: string): string {
	const base = sectionId(value) || fallback;
	const count = seen.get(base) ?? 0;
	seen.set(base, count + 1);
	return count === 0 ? base : `${base}-${count + 1}`;
}

export interface BuiltOutline {
	/** Anchor id per section, positionally. */
	sectionIds: string[];
	/** Anchor id per heading block, keyed `"<sectionIndex>:<blockIndex>"`. */
	blockIds: Map<string, string>;
	/** Flat entry list, sections and their headings interleaved in document order. */
	outline: OutlineEntry[];
}

function isHeadingBlock(block: ContentBlock): block is Extract<ContentBlock, { type: 'heading' }> {
	return block.type === 'heading';
}

export function buildOutline(sections: ReferenceSection[]): BuiltOutline {
	const seen = new Map<string, number>();
	const sectionIds: string[] = [];
	const blockIds = new Map<string, string>();
	const outline: OutlineEntry[] = [];

	sections.forEach((section, sectionIndex) => {
		const id = uniqueSlug(section.title, seen, 'section');
		sectionIds.push(id);
		outline.push({ id, label: section.title, level: 2 });

		section.content.forEach((block, blockIndex) => {
			if (!isHeadingBlock(block) || !block.text) {
				return;
			}
			const blockId = uniqueSlug(`${section.title} ${block.text}`, seen, `${id}-heading`);
			blockIds.set(`${sectionIndex}:${blockIndex}`, blockId);
			outline.push({
				id: blockId,
				label: block.text,
				level: normalizeHeadingLevel(block.level)
			});
		});
	});

	return { sectionIds, blockIds, outline };
}
