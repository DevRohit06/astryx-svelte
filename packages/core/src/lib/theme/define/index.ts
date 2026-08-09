/**
 * `@astryx-svelte/core/theme/define` — the component-free half of `./theme`.
 *
 * ## Why this subpath exists (it has no upstream counterpart)
 *
 * Upstream's `@astryxdesign/core/theme` is loadable by plain Node: its
 * components compile to ordinary `.js`, so `astryx theme build` can simply
 * `await import('@astryxdesign/core/theme')` and take `defineTheme` off it.
 *
 * Ours cannot. `./theme` re-exports `Theme`, `MediaTheme` and `SyntaxTheme`, so
 * its first statement reaches a `.svelte` module and Node fails the whole graph
 * with `ERR_UNKNOWN_FILE_EXTENSION` before any token function is reachable.
 * That closes the door on three things at once:
 *
 * - `astryx-svelte theme build`, which must import a theme compiler;
 * - a theme *definition file* (`src/themes/mine.ts`), which the CLI loads with
 *   jiti and which therefore must name a specifier plain Node can resolve;
 * - `packages/themes/*`, whose build scripts run under `node
 *   --experimental-strip-types` and had been reaching into
 *   `../../../core/dist/theme/define-theme.js` by relative path to get around it
 *   — a path that resolves to nothing once the package is published.
 *
 * So this module publishes exactly the part of `./theme` with no `.svelte` and
 * no uncompiled StyleX in its transitive graph: theme authoring, syntax-theme
 * authoring, and CSS generation. Everything here is also exported from
 * `./theme`; nothing here is exclusive to it. Import from `./theme` in an app,
 * from `./theme/define` in a theme definition or a build script.
 *
 * **Do not add a component, a hook, or anything reaching `styles/tokens.stylex`
 * to this barrel** — `dist/theme/tokens.js` throws `Unexpected
 * 'stylex.defineVars' call at runtime` under plain Node, because `dist/` ships
 * StyleX uncompiled. Type-only re-exports are erased, so those are safe.
 */

export { defineTheme, resolveTokenValue } from '../define-theme.js';
export type {
	ComponentOverrides,
	DefinedTheme,
	StyleOverrides,
	ThemeConfig,
	TokenMap,
	TokenValue
} from '../define-theme.js';

export {
	defineSyntaxTheme,
	syntaxThemeStyle,
	syntaxThemeToCSS
} from '../syntax/define-syntax-theme.js';
export { syntaxTokenDefaults } from '../syntax/tokens.js';
export type { SyntaxTokenName } from '../syntax/tokens.js';
export type {
	SyntaxThemeDefinition,
	SyntaxThemeInput,
	SyntaxThemeTokenInput,
	SyntaxThemeTokenKey,
	SyntaxThemeTokenMap,
	SyntaxTokenValue
} from '../syntax/define-syntax-theme.js';

export {
	generateOnMediaCss,
	generateThemeCss,
	generateThemeRulesSplit
} from '../generate-theme-rules.js';
export type { ThemeRulesSplit } from '../generate-theme-rules.js';
