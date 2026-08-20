export { default as Theme } from './theme.svelte';
// `ThemeProps` is deliberately absent: upstream declares it module-privately in
// `Theme.tsx` and publishes no props type for the component, as with
// `SyntaxThemeProps`.

export { default as MediaTheme } from './media-theme.svelte';
export type { MediaThemeProps } from './media-theme.svelte';

// Upstream publishes the `ThemeContext` object itself alongside its value type
// (`theme/index.ts` re-exports both from `useTheme.ts`), so ours does too; the
// `setThemeContext`/`useThemeContext` wrappers stay module-private, per the
// convention the other context exports state.
export { ThemeContext } from './theme-context.js';
export type { ThemeContextValue } from './theme-context.js';

// No `UseThemeNameReturn`: upstream's `useThemeName()` returns `string | null`,
// so it names no return type on this barrel or anywhere else. Ours wraps the
// value in a getter object for reactivity — a port artifact, kept module-public
// and unpublished rather than invented onto the surface.
export { useTheme, useThemeName } from './use-theme.svelte.js';
export type { UseThemeReturn } from './use-theme.svelte.js';

// The name → theme map. Upstream's `theme/index.ts` publishes all four,
// `resetThemes` included — it is `@internal` there too, and exported anyway so a
// consumer's test suite can clear the registry between cases.
export {
	getRegisteredTheme,
	getRegisteredThemes,
	registerTheme,
	resetThemes
} from './theme-registry.js';

export { resolveThemeToken, resolveThemeTokens, tokenVar, tokenVars } from './tokens.js';
export type {
	ResolvedThemeMode,
	ResolveThemeTokenOptions,
	ResolveThemeTokensOptions
} from './tokens.js';

export { tokenDefaults } from './tokens.js';

// Upstream's `theme/index.ts` republishes `TextColorMap` from `../Text` and
// `BuiltinTextColor` from `./types`, so this subpath carries both — the root
// barrel's note beside `TextColorMap` says so. Ours declare the pair together in
// `components/text/text.stylex.ts` instead of splitting them across `Text` and
// `theme/types`: `TextColor` indexes the StyleX colour styles, and StyleX may
// only be imported from a `.ts`. Type-only, so nothing of the style module
// reaches this subpath's JavaScript.
export type { BuiltinTextColor, TextColorMap } from '../components/text/text.stylex.js';

// `TypographyConfig`, `TypographyRole` and `FontWeight` are `defineTheme`'s input
// vocabulary, and upstream publishes all three from `theme/types.ts` — not from
// the expander, which takes a config whose weights are already resolved to CSS
// values. This port had them on `expand-type-scale.ts` under the names `TypeRole`
// and `TypeWeight`, so `TypeScaleConfig` was shape drift under a shared name.
export type { FontWeight, ThemeMode, TypographyConfig, TypographyRole } from './types.js';

export { defineTheme, resolveTokenValue } from './define-theme.js';
export type {
	ComponentOverrides,
	DefinedTheme,
	StyleOverrides,
	ThemeConfig,
	TokenMap,
	TokenValue
} from './define-theme.js';

// Syntax theme API. Re-exported here as upstream's `theme/index.ts` does, and
// also available on its own `./theme/syntax` subpath, as upstream's is.
export { defineSyntaxTheme } from './syntax/index.js';
export type {
	SyntaxThemeDefinition,
	SyntaxThemeInput,
	SyntaxThemeTokenInput,
	SyntaxThemeTokenKey,
	SyntaxThemeTokenMap,
	SyntaxTokenValue
} from './syntax/index.js';

export { syntaxTokenDefaults } from './syntax/index.js';
export type { SyntaxTokenName } from './syntax/index.js';

// SyntaxTheme provider
export { SyntaxTheme, useSyntaxTheme } from './syntax/index.js';
export type { UseSyntaxThemeReturn } from './syntax/index.js';

export {
	defaultOnDarkTokens,
	defaultOnLightTokens,
	resolveOnMedia,
	type OnMediaOverrides,
	type ResolvedOnMedia
} from './on-media-tokens.js';

export {
	generateOnMediaCss,
	generateThemeCss,
	generateThemeRulesSplit
} from './generate-theme-rules.js';
export type { ThemeRulesSplit } from './generate-theme-rules.js';
export { parseStyleKey } from './parse-style-key.js';

export { expandMotionScale } from './expand-motion-scale.js';
export type { MotionScaleConfig, MotionScaleTokens } from './expand-motion-scale.js';

export { expandRadiusScale } from './expand-radius-scale.js';
export type { RadiusScaleConfig, RadiusScaleTokens } from './expand-radius-scale.js';

// The fourth expander, published beside the other three as upstream's
// `theme/index.ts` publishes it. Its `hct.ts`/`contrast.ts` helpers stay
// module-private, as upstream's do — neither its `theme/index.ts` nor its root
// barrel exports them. `ensureContrastTone` is likewise module-public and
// unpublished, matching upstream exactly.
export { expandColorScale } from './expand-color-scale.js';
export type { ColorScaleConfig, ColorScaleTokens } from './expand-color-scale.js';

export { expandTypeScale, generateTypeScaleComponents } from './expand-type-scale.js';
export type { TypeScaleConfig, TypeScaleTokens } from './expand-type-scale.js';

// Token defaults and vars for use in custom components and themes, as upstream's
// `theme/index.ts` publishes them — 12 `*Defaults`, 12 `*Vars`, 12 `*VarName`.
//
// These are runtime values, so this routes `styles/tokens.stylex.js` into the
// subpath's JavaScript, exactly as upstream's own `from './tokens.stylex'` does.
// It is not a new edge: `theme/tokens.ts` already value-imports the same module,
// and `./theme` exports Svelte components, so the subpath has never been
// importable under plain Node regardless. The one plain-Node consumer — the
// theme build in `packages/themes/shared/build-theme-package.mjs` — deep-imports
// `theme/generate-theme-rules.js` and never loads this barrel.
export {
	colorDefaults,
	spacingDefaults,
	sizeDefaults,
	borderDefaults,
	focusDefaults,
	radiusDefaults,
	shadowDefaults,
	durationDefaults,
	easeDefaults,
	typographyDefaults,
	textSizeDefaults,
	fontWeightDefaults,
	typeScaleDefaults,
	colorVars,
	spacingVars,
	sizeVars,
	borderVars,
	focusVars,
	radiusVars,
	shadowVars,
	durationVars,
	easeVars,
	typographyVars,
	textSizeVars,
	fontWeightVars,
	typeScaleVars
} from '../styles/tokens.stylex.js';

// Token key types for theme authoring.
export type {
	ColorVarName,
	SpacingVarName,
	SizeVarName,
	BorderVarName,
	RadiusVarName,
	ShadowVarName,
	DurationVarName,
	EaseVarName,
	TypographyVarName,
	TextSizeVarName,
	FontWeightVarName,
	TypeScaleVarName
} from '../styles/tokens.stylex.js';
