/**
 * Landing-page constants, ported from upstream's `apps/docsite/src/constants.ts`.
 *
 * Upstream's file also carries `DISCORD_URL`, `FACEBOOK_URL`, `INSTAGRAM_URL`,
 * `THREADS_URL` and `X_URL`. Those are Meta's own accounts, and this port ships
 * neither its trademarks nor its accounts — the same call `site-footer.svelte`
 * already made for the social block (port/todo.md → Release & governance). They are
 * absent rather than repointed.
 *
 * `GITHUB_REPO` is likewise not ported here: `shell/nav-items.ts` already owns
 * `REPO_URL`, which points at *this* port rather than `facebook/astryx`, with
 * the reasoning written down there.
 */

/**
 * This port's brand colour — logo/wordmark only, not wired to any semantic
 * token.
 *
 * Upstream's counterpart is `BRAND_BLUE = 'light-dark(#225BFF, #3D87FF)'`, the
 * Astryx brand blue. This port paints its mark Svelte orange instead, the same
 * identity `shell/astryx-logo.svelte` and the favicon already carry; a port that
 * wears Meta's brand colour is claiming an identity it does not have.
 *
 * Upstream's reason for the constant living *here* rather than in the theme
 * file holds unchanged: it can then be imported without pulling in the theme
 * object (which would re-trigger runtime style injection).
 *
 * **Kept in sync by hand with `routes/docs.css`'s `--color-brand`**, which is
 * the same value for the rest of the site — CSS cannot import a TS constant, and
 * `themes/astryx-theme.ts` re-declares the token inside the theme scope from
 * this constant.
 */
export const BRAND = '#ff3e00';
