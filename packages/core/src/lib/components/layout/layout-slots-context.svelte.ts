import { Context } from 'runed';

/**
 * Ported from Astryx's `Layout/LayoutSlotsContext.ts`.
 *
 * Which of a `Layout`'s surrounding slots are filled. `LayoutContent` and
 * `LayoutPanel` read it to decide whether an edge of theirs touches the
 * container — an edge that does takes the *outer* padding, one that abuts
 * another slot takes the inner.
 */

export interface LayoutSlots {
	hasHeader: boolean;
	hasFooter: boolean;
	hasStart: boolean;
	hasEnd: boolean;
}

/** No slots filled — what a slot component used outside a `Layout` sees. */
const defaultSlots: LayoutSlots = {
	hasHeader: false,
	hasFooter: false,
	hasStart: false,
	hasEnd: false
};

const layoutSlotsContext = new Context<() => LayoutSlots>('astryx.layoutSlots');

export function setLayoutSlotsContext(get: () => LayoutSlots): void {
	layoutSlotsContext.set(get);
}

export function useLayoutSlots(): () => LayoutSlots {
	return layoutSlotsContext.getOr(() => defaultSlots);
}
