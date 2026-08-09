/**
 * Same settings as `packages/core/prettier.config.js` — tabs, single quotes, no
 * trailing commas, 100 columns — minus the Svelte plugin, because this package
 * has no `.svelte` files: it *emits* them (`template`, `swizzle`, `layout
 * expand`) but never contains one. Template sources land under `assets/` in a
 * later slice and are excluded in `.prettierignore`, since reformatting a
 * scaffold changes what a user's project receives.
 *
 * Upstream's CLI is formatted at 2-space / 90 columns. This port follows the
 * repo's convention instead of upstream's: formatting is not part of the
 * emitted API, and a package that lints differently from its six siblings is a
 * hazard for anyone editing across them.
 *
 * @type {import("prettier").Config}
 */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100
};

export default config;
