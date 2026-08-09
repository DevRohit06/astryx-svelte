import * as stylex from '@stylexjs/stylex';

/**
 * Ported from the `tableRowMarker` declared in Astryx's `Table/table.stylex.ts`.
 *
 * A marker lives in its own module because `defineMarker()`'s class is derived
 * from the declaring module's path — keeping it here means the surrounding
 * style module can be compared against upstream's without the marker's own
 * name entering the diff. (The `checkboxScope` / `radioScope` / `switchScope` /
 * `overlayScope` / `tabScope` / `treeItemScope` precedent.)
 *
 * Applied to each `<tr>` by `TableRow` so that a cell's
 * `stylex.when.ancestor(':last-child', tableRowMarker)` matches only the parent
 * row — not `<tbody>` or `<table>`, which are also `:last-child` and would
 * suppress the bottom border on every row rather than the last one.
 */
export const tableRowMarker: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();
