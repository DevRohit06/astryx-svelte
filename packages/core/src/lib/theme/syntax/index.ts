/**
 * Re-exports for the syntax theme subsystem, mirroring Astryx's
 * `theme/syntax/index.ts`.
 *
 * The one shape difference is React's: upstream's `SyntaxTheme` and
 * `useSyntaxTheme` live in a single `.tsx`, where the component and the hook can
 * share a module-private context. Here they are three modules — component, hook
 * and context — because a `.svelte` file cannot export a function. The published
 * surface is the same, and the context stays private in both.
 */

export { syntaxTokenDefaults } from './tokens.js';
export type { SyntaxTokenName } from './tokens.js';

// `ALL_SYNTAX_KEYS` and `resolveSyntaxTokenForMode` are exported from
// `define-syntax-theme.ts` (upstream exports them from its module too) but are
// deliberately **not** re-exported here: upstream's `theme/syntax/index.ts`
// publishes only these three. `use-syntax-theme.svelte.ts` imports them from the
// module directly, as upstream's `SyntaxTheme.tsx` does.
export { defineSyntaxTheme, syntaxThemeStyle, syntaxThemeToCSS } from './define-syntax-theme.js';
export type {
	SyntaxThemeDefinition,
	SyntaxThemeInput,
	SyntaxThemeTokenInput,
	SyntaxThemeTokenKey,
	SyntaxThemeTokenMap,
	SyntaxTokenValue
} from './define-syntax-theme.js';

// No `SyntaxThemeProps` — upstream keeps that interface module-private and
// publishes no props type for this component.
export { default as SyntaxTheme } from './syntax-theme.svelte';
export { useSyntaxTheme } from './use-syntax-theme.svelte.js';
export type { UseSyntaxThemeReturn } from './use-syntax-theme.svelte.js';

// Community syntax theme presets (formerly `@astryxdesign/theme-syntax`).
export {
	allSyntaxPresets,
	catppuccinLatte,
	catppuccinMocha,
	darkSyntaxPresets,
	dracula,
	githubDark,
	githubLight,
	lightSyntaxPresets,
	monokai,
	nord,
	oneDarkPro,
	oneLight,
	solarizedLight,
	tokyoNight,
	tokyoNightLight
} from './presets.js';
