import { Context } from 'runed';

/**
 * Ported from Astryx's `Layout/LayoutAreaContext.ts`.
 *
 * Which of a `Layout`'s five slots a component was rendered into. `LayoutPanel`
 * is the only consumer so far: it picks the edge its divider sits on, and the
 * side it collapses when there is none.
 */

/** The slot a component is rendered in, or `null` outside a `Layout`. */
export type LayoutArea = 'header' | 'footer' | 'content' | 'start' | 'end' | null;

/** Named as upstream names its context object, and public for the same reason. */
export const LayoutAreaContext = new Context<() => LayoutArea>('astryx.layoutArea');

export function setLayoutAreaContext(get: () => LayoutArea): void {
	LayoutAreaContext.set(get);
}

/**
 * Reads the enclosing area at init and returns a getter. Upstream's context
 * defaults to `null`, and so does this — a slot component used outside a
 * `Layout` is a supported case, not an error.
 */
export function useLayoutArea(): () => LayoutArea {
	return LayoutAreaContext.getOr(() => null);
}
