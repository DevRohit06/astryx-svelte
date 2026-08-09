// Diffs our generated theme.css against `@astryxdesign/theme-matcha`'s, in both
// directions. The comparison lives in `packages/themes/shared`, which every
// theme package calls the same way; see that file for what the two directions
// buy and why the allowlist self-retires.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLOR_SCHEME_IN_BASE_CSS, compareThemeCss } from '../../shared/compare-theme-css.mjs';

await compareThemeCss({
	packageDir: join(dirname(fileURLToPath(import.meta.url)), '..'),
	upstreamPackage: '@astryxdesign/theme-matcha',
	emittedElsewhere: { ...COLOR_SCHEME_IN_BASE_CSS }
});
