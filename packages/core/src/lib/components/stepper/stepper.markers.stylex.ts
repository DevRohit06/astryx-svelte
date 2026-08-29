import * as stylex from '@stylexjs/stylex';

/**
 * Scoped marker applied to each `Step`'s `<li>`, ported from Astryx's
 * `Stepper/stepper.stylex.ts`.
 *
 * The on-track connector segments key their first/last-node visibility off
 * `stylex.when.ancestor(':first-child' | ':last-child', stepMarker)`, so the
 * selector matches only the parent step row and never the outer `<ol>` (which
 * is a `:first-child`/`:last-child` in its own right). That replaces counting
 * children in the parent, so steps behave correctly however a consumer groups
 * them.
 *
 * Named `stepper.markers.stylex.ts` rather than upstream's `stepper.stylex.ts`:
 * this port's convention is `<name>.stylex.ts` for `<name>.svelte`'s styles, and
 * `stepper.stylex.ts` is therefore already taken by `Stepper`'s own layout
 * styles. `.markers.stylex.ts` is the suffix every other marker module in this
 * package uses (`indicator.markers`, `tab.markers`, `overlay.markers`), and
 * upstream uses it for its own markers elsewhere — only this one file is spelled
 * differently there.
 *
 * A marker's class is **path-derived**, so ours can never equal upstream's. Keys
 * resolving against it are diffed as marker-normalised CSS by the class oracle
 * rather than by class equality, the same treatment the other marker modules in
 * this port already get.
 */
export const stepMarker: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();
