// Compiles the neutral theme definition into dist/theme.css, dist/index.js and
// dist/index.d.ts. The work lives in `packages/themes/shared`, which every theme
// package calls the same way; see that file for the why.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemePackage } from '../../shared/build-theme-package.mjs';
import { neutralTheme } from '../src/neutral-theme.ts';

await buildThemePackage({
	packageDir: join(dirname(fileURLToPath(import.meta.url)), '..'),
	packageName: '@astryx-svelte/theme-neutral',
	themeExport: 'neutralTheme',
	theme: neutralTheme,
	// Upstream's `theme-neutral` publishes no `*Palettes` export — only butter,
	// gothic, stone and y2k carry one.
	//
	// The registry is named, not imported, and deliberately so: this script runs
	// under plain Node, which cannot parse `src/icons.svelte`. Nothing here
	// resolves `@lucide/svelte` either, so `build` still works in a checkout
	// where it has not been installed — only the runtime and `test:icons` need
	// it. See `buildThemePackage`'s `icons` parameter.
	icons: { name: 'neutralIconRegistry', file: 'icons.svelte' }
});
