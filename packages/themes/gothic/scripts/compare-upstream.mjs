// Diffs our generated theme.css against `@astryxdesign/theme-gothic`'s, in both
// directions. The comparison lives in `packages/themes/shared`, which every
// theme package calls the same way; see that file for what the two directions
// buy and why the allowlist self-retires.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareThemeCss } from '../../shared/compare-theme-css.mjs';

await compareThemeCss({
	packageDir: join(dirname(fileURLToPath(import.meta.url)), '..'),
	upstreamPackage: '@astryxdesign/theme-gothic',
	// **No `COLOR_SCHEME_IN_BASE_CSS` here, unlike every other theme package.**
	// Gothic is dark-only: it declares no `[light, dark]` token pairs, so
	// upstream's generator emits no `:root` / `html[data-theme=…]` colour-scheme
	// block for it at all — only the two `[data-astryx-media=…]` ones, which this
	// port emits itself and which therefore match in the forward direction.
	// Spreading the shared allowlist in would have added three entries excusing
	// declarations upstream does not have, and the stale-entry check said so.
	emittedElsewhere: {}
});
