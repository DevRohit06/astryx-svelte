// Shared build for every `packages/themes/*` package.
//
// This is the Svelte-side equivalent of Astryx's `astryx theme build`, and will
// move into the CLI as `astryx-svelte theme build` once that package exists.
//
// Requires @astryx-svelte/core to be built first (`pnpm --filter
// @astryx-svelte/core build`), since it imports the compiled theme compiler.
// Under pnpm's topological ordering `pnpm -r build` already does that.
//
// The per-package `scripts/build-theme.mjs` is a thin caller: it imports its own
// theme definition and hands it here. It runs under Node's type stripping so the
// theme definition can stay in TypeScript — the `--experimental-strip-types`
// flag lives in each package's `build` script. The flag is a no-op from Node
// 22.18, where stripping is on by default, but the floor here is 22.17 (see
// TODO, Phase 0).
//
// This directory is deliberately **not** a workspace package: it has no
// `package.json`, so pnpm's `packages/themes/*` glob skips it. It is repo
// tooling the theme packages reach by relative path, not something they depend
// on or publish.

import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateThemeCss } from '../../core/dist/theme/generate-theme-rules.js';

/**
 * Renders a plain nested object of primitive values as a TypeScript literal
 * type, mirroring what `as const` infers for it upstream.
 *
 * Upstream publishes `butterPalettes` & co. with fully literal `readonly` types
 * (its source writes the object `as const` and tsc emits the declaration). Ours
 * are generated rather than compiled, so the type is generated too — nobody
 * maintains it by hand, which is what makes the verbosity free.
 *
 * The primitive guard tests `typeof value !== 'object'` rather than listing
 * `'string'`, because it used to list exactly that and numbers fell through to
 * the object branch — where `Object.entries(291)` is `[]`, so a numeric palette
 * value emitted `readonly hue: { }` instead of `readonly hue: 291`. Nothing
 * caught it: the runtime value in `index.js` was always right, `{}` is valid TS
 * so `check` stayed green, and the theme oracles diff CSS declarations rather
 * than declaration files. It reached the published `index.d.ts` of `gothic` and
 * `y2k` (10 entries each) before `stone`'s `hue`/`chroma` numerics made it 20 in
 * one package and someone read the output.
 *
 * @param {unknown} value
 * @param {string} indent
 * @returns {string}
 */
function literalType(value, indent = '\t') {
	if (value === null || typeof value !== 'object') return JSON.stringify(value);
	const inner = indent + '\t';
	const entries = Object.entries(/** @type {Record<string, unknown>} */ (value)).map(
		// Bare for anything tsc would leave bare — a numeric key or a valid
		// identifier — and quoted otherwise. This used to quote every non-numeric
		// key, which typed identically (`readonly "hue"` and `readonly hue` are the
		// same property) but made our generated `.d.ts` needlessly unlike the
		// upstream declaration it mirrors, and so harder to diff by eye.
		([key, child]) => {
			const bare = /^\d+$/.test(key) || /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
			const name = bare ? key : JSON.stringify(key);
			return `${inner}readonly ${name}: ${literalType(child, inner)};`;
		}
	);
	return `{\n${entries.join('\n')}\n${indent}}`;
}

/**
 * Compiles a theme definition into `dist/theme.css`, plus the `dist/index.js`
 * and `dist/index.d.ts` the package's `.` export promises and the
 * `dist/tokens.js` / `dist/tokens.d.ts` behind `./tokens`.
 *
 * @param {object} options
 * @param {string} options.packageDir Absolute path to the theme package root.
 * @param {string} options.packageName e.g. `@astryx-svelte/theme-matcha`.
 * @param {string} options.themeExport e.g. `matchaTheme`.
 * @param {import('../../core/dist/theme/define-theme.js').DefinedTheme} options.theme
 * @param {{name: string, value: unknown}} [options.palettes] The raw tonal ramps
 *   the upstream package publishes alongside its theme, where it has them.
 * @param {{name: string, file: string}} [options.icons] The icon registry the
 *   package ships, where it has one: `name` is the exported binding
 *   (`neutralIconRegistry`), `file` the `.svelte` module under `src/` defining
 *   it. Unlike every other input here the registry is not data — its values are
 *   snippets, i.e. functions, which `JSON.stringify` drops silently — so it is
 *   named rather than passed by value, and `dist/index.js` composes it onto the
 *   serialised theme with a spread. The theme *definition* in `src/` does not
 *   carry it. That is the one place
 *   this build diverges in shape from upstream, which writes
 *   `defineTheme({icons})` directly in its theme source: that source is on this
 *   build's plain-Node import path (`--experimental-strip-types`), where a
 *   `.svelte` import cannot be parsed. The published surface is the same — the
 *   theme object has `.icons` and the package exports the registry — the
 *   assembly just happens here instead of there.
 */
export async function buildThemePackage({
	packageDir,
	packageName,
	themeExport,
	theme,
	palettes,
	icons
}) {
	const outDir = join(packageDir, 'dist');
	const css = generateThemeCss(theme);

	await mkdir(outDir, { recursive: true });
	await writeFile(join(outDir, 'theme.css'), css, 'utf8');

	// Copied rather than compiled. `svelte-package` leaves `.svelte` files
	// essentially as authored — core's published `default-icons.svelte` still
	// carries its `lang="ts"` and its type import — and its two real transforms,
	// rewriting `$lib` aliases and `.ts` specifiers, have nothing to act on in a
	// registry module that imports only `@lucide/svelte` and a type from
	// `@astryx-svelte/core`. Both are bare specifiers, so they resolve the same
	// from `dist/` as from `src/`; a relative import into core would not, and is
	// the thing to avoid in that file. Consumers compile it, exactly as they
	// already compile core's.
	if (icons) {
		await copyFile(join(packageDir, 'src', icons.file), join(outDir, icons.file));
	}

	// The package's `.` export promises a theme *object* alongside the stylesheet
	// — `<Theme theme={…}>` needs one, and so does `useTheme()`, which resolves
	// token values from it. It carries `__built: true`, exactly as upstream's
	// `astryx theme build` artifact does, so `<Theme>` skips runtime style
	// injection: the CSS is already the file next to it.
	const built = { ...theme, __built: true };

	const literal = JSON.stringify(built, null, '\t');

	// ── The `./tokens` entry ────────────────────────────────────────────────
	//
	// The theme as *data*: the same object the `.` export publishes, minus
	// `icons`, in a module that imports nothing. It exists because `dist/index.js`
	// has to import the `.svelte` registry to attach it, and that single statement
	// makes the whole `.` entry unreadable to plain Node —
	// `ERR_UNKNOWN_FILE_EXTENSION`, thrown before the token object is reachable.
	// Every theme in this repo hits it, because every theme ships a registry.
	//
	// The CLI's `resolveTheme` (which answers "what theme is this project
	// configured with, and what variants/fonts does it add?") reads a theme
	// package with `import()` and needs an entry it can actually parse. So does
	// any script, oracle or tool that wants token values without a Svelte
	// toolchain. Upstream needs no equivalent: its registries are `.tsx` that
	// compile to `.js`, so its `.` entry loads under Node as-is.
	//
	// `.` is unchanged in shape — it spreads this object and adds `icons`.
	const tokensModule = `// @generated by scripts/build-theme.mjs — do not edit.
//
// The ${theme.name} theme as plain data — no icon registry, no imports, so this
// module is readable by anything that can parse JavaScript, \`node\` included.
// The package's \`.\` export is this object with \`icons\` attached; prefer it in
// an app. See build-theme-package.mjs for why the split exists.

/** @type {import('@astryx-svelte/core/theme').DefinedTheme} */
export const ${themeExport} = ${literal};
`;

	const tokensTypes = `import type { DefinedTheme } from '@astryx-svelte/core/theme';

/**
 * The ${theme.name} theme as plain data — the \`.\` export's object without
 * \`icons\`, in a module that imports nothing. Readable by plain Node, which the
 * \`.\` entry is not: it reaches a \`.svelte\` registry.
 */
export declare const ${themeExport}: DefinedTheme;
`;

	await writeFile(join(outDir, 'tokens.js'), tokensModule, 'utf8');
	await writeFile(join(outDir, 'tokens.d.ts'), tokensTypes, 'utf8');

	let module = `// @generated by scripts/build-theme.mjs — do not edit.
//
// The ${theme.name} theme as a built artifact. Import the stylesheet alongside it:
//
//   import { ${themeExport} } from '${packageName}';
//   import '${packageName}/theme.css';
${
	icons
		? `
import { ${icons.name} } from './${icons.file}';
import { ${themeExport} as ${themeExport}Tokens } from './tokens.js';

export { ${icons.name} };

/** @type {import('@astryx-svelte/core/theme').DefinedTheme} */
export const ${themeExport} = { ...${themeExport}Tokens, icons: ${icons.name} };
`
		: `
export { ${themeExport} } from './tokens.js';
`
}`;

	let types = `import type { DefinedTheme } from '@astryx-svelte/core/theme';
${icons ? `import type { IconRegistry } from '@astryx-svelte/core';\n` : ''}
/**
 * The ${theme.name} theme, pre-built. Its CSS ships as \`./theme.css\`, so it carries
 * \`__built\` and \`<Theme>\` injects nothing at runtime.
 */
export declare const ${themeExport}: DefinedTheme;
`;

	if (icons) {
		types += `
/**
 * The 28 semantic icon names mapped to Lucide glyphs, as upstream's package
 * publishes them. Already attached to \`${themeExport}.icons\`, so a \`<Theme>\` picks
 * them up with no further wiring; exported separately for \`registerIcons()\` and
 * for composing a theme of your own.
 */
export declare const ${icons.name}: IconRegistry;
`;
	}

	if (palettes) {
		module += `
/**
 * Raw tonal palettes, as upstream's package publishes them. Pure data — the
 * ramps the token values above were picked from.
 */
export const ${palettes.name} = ${JSON.stringify(palettes.value, null, '\t')};
`;
		types += `
/**
 * Raw tonal palettes, as upstream's package publishes them. Pure data — the
 * ramps the token values above were picked from.
 */
export declare const ${palettes.name}: ${literalType(palettes.value)};
`;
	}

	await writeFile(join(outDir, 'index.js'), module, 'utf8');
	await writeFile(join(outDir, 'index.d.ts'), types, 'utf8');

	const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1);
	console.log(
		`${theme.name}: theme.css — ${kb(css)} KB, index.js — ${kb(module)} KB` +
			(icons ? `, ${icons.file} — copied` : '')
	);
}
