import { Context } from 'runed';

/**
 * Ported from Astryx's `MetadataList/MetadataListContext.tsx`, plus the two
 * members that replace `Children.toArray`.
 *
 * Upstream counts and slices its children directly, which React allows and
 * Svelte has no counterpart for: content arrives as one opaque snippet, and
 * there is nothing there to count or slice. Instead each item **registers
 * itself** during init and gets back its index, and the list asks
 * `isItemVisible(index)` to decide whether that item renders at all.
 *
 * Two properties make this a faithful substitute rather than an approximation:
 *
 * 1. **It runs during render, on the server too.** A child's `<script>` is
 *    evaluated as the parent's template reaches it, so by the time the list
 *    renders its "Show more" toggle — which comes after the items in the
 *    template — every item has registered and `total` is final. The toggle is
 *    therefore in the server-rendered HTML, exactly as upstream's is, with no
 *    post-hydration pop.
 *
 *    This is why `isItemVisible` is a plain function and both call sites read it
 *    as one. A `$derived` is computed once per server render and then cached, so
 *    the first item — reading it when `total` was 1 — would fix the answer for
 *    every later item and for the toggle. `metadata-list.test.ts` pins it.
 * 2. **Hidden items are not rendered**, rather than hidden with CSS, which is
 *    what upstream's `slice` does.
 *
 * The one limit: an index is assigned in mount order, so a list whose items are
 * reordered after mount would keep its original numbering. Upstream's array
 * index has the same shape of assumption, and every documented usage is a static
 * list of items.
 */

export interface MetadataListLabelConfig {
	position: 'start' | 'top';
	/** Custom label column width — a number of pixels, or any CSS length. */
	width?: number | string;
}

export interface MetadataListContextValue {
	labelConfig: MetadataListLabelConfig;
	orientation: 'vertical' | 'horizontal';
	/** Claims the next index. Called once per item, during its init. */
	register: () => number;
	/** Whether the item at this index is within the current cut. */
	isItemVisible: (index: number) => boolean;
}

const metadataListContext = new Context<() => MetadataListContextValue>('astryx.metadataList');

export function setMetadataListContext(get: () => MetadataListContextValue): void {
	metadataListContext.set(get);
}

/**
 * Returns a getter for the enclosing list's configuration, or `null` outside
 * one — upstream's context defaults to `null` and its item falls back to
 * `position: 'start'`.
 */
export function useMetadataList(): () => MetadataListContextValue | null {
	return metadataListContext.getOr(() => null);
}
