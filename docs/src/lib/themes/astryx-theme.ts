/**
 * The Astryx docsite's own brand theme, ported from upstream's
 * `apps/docsite/src/themes/astryxTheme.ts`.
 *
 * This is **not** a theme package. Upstream ships seven of those under
 * `packages/themes/*`; this one lives in the docsite and exists only to skin the
 * marketing site. That is why it is here and not in `packages/themes/` — a
 * consumer of `@astryx-svelte/core` never sees it.
 *
 * The token and component overrides live in `astryx-theme-config.ts`, which
 * explains why they are a file apart.
 */

import { defineTheme, type DefinedTheme } from '@astryx-svelte/core/theme';
import { BRAND } from '../landing/constants.js';
import { createAstryxThemeConfig } from './astryx-theme-config.js';

/**
 * The theme as the app consumes it. `__built: true` is what upstream's
 * `astryx theme build` stamps on its artifact, and it is what stops `<Theme>`
 * injecting a stylesheet at runtime — the CSS is already generated into
 * `src/lib/generated/astryx-theme.css` and imported by the root layout. Same
 * contract as `@astryx-svelte/theme-neutral`'s `dist/index.js`.
 *
 * It matters more here than it looks: the landing page mounts a `<Theme>` for
 * the wordmark, one for the cards layer, one for the collage and two `DarkScope`
 * wrappers, and upstream's page.tsx calls out runtime injection as the thing to
 * avoid on this page specifically.
 */
export const astryxTheme: DefinedTheme = {
	...defineTheme(createAstryxThemeConfig(BRAND)),
	// Annotated above rather than inferred: without the contextual type this
	// widens to `boolean`, and `DefinedTheme.__built` is the literal `true`.
	__built: true
};
