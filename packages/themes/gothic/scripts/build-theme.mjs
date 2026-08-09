// Compiles the gothic theme definition into dist/theme.css, dist/index.js and
// dist/index.d.ts. The work lives in `packages/themes/shared`, which every theme
// package calls the same way; see that file for the why.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemePackage } from '../../shared/build-theme-package.mjs';
import { gothicPalettes, gothicTheme } from '../src/gothic-theme.ts';

await buildThemePackage({
	packageDir: join(dirname(fileURLToPath(import.meta.url)), '..'),
	packageName: '@astryx-svelte/theme-gothic',
	themeExport: 'gothicTheme',
	theme: gothicTheme,
	// Upstream's `source.ts` publishes the raw ramps alongside the theme, so this
	// package's `.` export does too.
	palettes: { name: 'gothicPalettes', value: gothicPalettes },
	// The registry is named, not imported: this script runs under plain Node,
	// which cannot parse `src/icons.svelte`. Nothing here resolves
	// `@lucide/svelte` either, so `build` still works in a checkout where it has
	// not been installed — only the runtime and `test:icons` need it. See
	// `buildThemePackage`'s `icons` parameter.
	icons: { name: 'gothicIconRegistry', file: 'icons.svelte' }
});
