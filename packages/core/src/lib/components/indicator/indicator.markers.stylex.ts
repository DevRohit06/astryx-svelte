import * as stylex from '@stylexjs/stylex';

/**
 * Scoped marker for indicator ancestor selectors.
 *
 * An owner (CheckboxInput's row, RadioListItem's row) applies this marker to
 * the element whose hover and focus should drive the indicator's appearance.
 * The indicator reads it through `stylex.when.ancestor()`, so interaction
 * state stays in CSS instead of being threaded through props — and owners that
 * should *not* tint their indicator on hover (decorative menu markers, listbox
 * options) simply don't apply the marker.
 *
 * Owners apply it only while enabled, so disabled controls get no hover
 * feedback.
 *
 * A marker's class is **path-derived**, so ours can never equal upstream's.
 * Keys resolving against it are diffed as marker-normalised CSS by the class
 * oracle rather than by class equality — the same treatment `switch.markers`
 * and the other marker modules in this port already get.
 */
export const indicatorScope: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();
