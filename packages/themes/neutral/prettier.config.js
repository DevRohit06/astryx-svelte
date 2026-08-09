/**
 * Same settings as `packages/core/prettier.config.js` — tabs, single quotes, no
 * trailing commas, 100 columns — including the Svelte plugin, because this
 * package ships one `.svelte` file: `src/icons.svelte`, the icon registry.
 * Snippets are a compiler construct, so the registry cannot live in a `.ts`
 * module; see the file's own header. Kept as its own config rather than shared
 * so the package can be linted standalone, which is how `pnpm -r lint` reaches
 * it.
 *
 * The other theme packages have no `.svelte` file and so omit the plugin. If one
 * of them gains an icon registry, it needs this config too — prettier cannot
 * parse a `.svelte` file without the plugin, and `lint` fails rather than
 * skipping it.
 *
 * @type {import("prettier").Config}
 */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }]
};

export default config;
