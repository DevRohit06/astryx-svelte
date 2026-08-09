/**
 * Shared content max-widths, ported from upstream's `layout.stylex.ts`.
 *
 * Upstream declares them with `stylex.defineConsts` so the same value can be
 * used inside `stylex.create` and as a component prop. This app authors its
 * chrome in scoped CSS rather than StyleX, so the CSS side lives in
 * `routes/landing.css` as `--docs-content-max-width` / `--docs-prose-max-width`
 * and this module carries the numbers for the props that take one.
 *
 * **Keep the two in sync by hand** — there is no `defineConsts` to derive one
 * from the other, and a divergence shows up as a section that no longer lines up
 * with its neighbours.
 */

/** Wide content cap for showcase/landing/index sections. */
export const CONTENT_MAX_WIDTH = 1200;

/** Reading-width cap for docs and prose content. */
export const PROSE_MAX_WIDTH = 800;
