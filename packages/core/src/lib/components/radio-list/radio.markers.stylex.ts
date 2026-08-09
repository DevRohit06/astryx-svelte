import * as stylex from '@stylexjs/stylex';

/**
 * Ported from Astryx's `RadioList/radio.markers.stylex.ts`.
 *
 * A StyleX marker scoping `RadioListItem`'s hover tints to their own item, so a
 * parent container's hover never bleeds into the radio. Applied on the item
 * container only when the item is enabled; the radio's `when.ancestor(':hover')`
 * rules resolve against it.
 *
 * Its class is derived from this module's path, so it cannot match upstream's by
 * name — the oracle compares it marker-normalised, the same way `switchScope`
 * is handled.
 */
export const radioScope: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();
