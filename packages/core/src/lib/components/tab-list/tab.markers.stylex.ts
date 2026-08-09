import * as stylex from '@stylexjs/stylex';

/**
 * Ported from Astryx's `TabList/tab.markers.stylex.ts`.
 *
 * Scoped marker for `Tab` ancestor selectors. Used by both `Tab` and `TabMenu`
 * to scope hover background styles and ensure they don't leak from parent
 * containers.
 *
 * Its class is derived from this module's path, so it cannot match upstream's by
 * name — the oracle compares the rules that carry it marker-normalised, as it
 * does for `radioScope`/`switchScope`/`treeItemScope`.
 */
export const tabScope: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();
