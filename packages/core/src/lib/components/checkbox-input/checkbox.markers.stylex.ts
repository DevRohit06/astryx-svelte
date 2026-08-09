import * as stylex from '@stylexjs/stylex';

/**
 * Scoped marker for CheckboxInput ancestor selectors, ported from Astryx's
 * `CheckboxInput/checkbox.markers.stylex.ts`.
 *
 * The box's focus outline and its hover tints are pure CSS: they key off
 * `when.ancestor(':has(:focus-visible)', checkboxScope)` and
 * `when.ancestor(':hover', checkboxScope)`, which resolve against this marker on
 * the checkbox *row*. Scoping to the marker rather than a bare `:hover`/`:focus`
 * is what stops a parent container's hover or focus-within from bleeding onto
 * the control. The row drops the marker while disabled, so a disabled checkbox
 * matches neither rule at all.
 *
 * A marker lives in its own module because `defineMarker()`'s class is derived
 * from the module's path — the same split `switch.markers.stylex.ts` uses.
 */
export const checkboxScope: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();
