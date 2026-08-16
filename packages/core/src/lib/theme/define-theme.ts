import { expandColorScale, type ColorScaleConfig } from './expand-color-scale.js';
import { expandMotionScale, type MotionScaleConfig } from './expand-motion-scale.js';
import { expandRadiusScale, type RadiusScaleConfig } from './expand-radius-scale.js';
import {
	expandTypeScale,
	generateTextColorComponents,
	generateTypeScaleComponents,
	type TypographyConfig
} from './expand-type-scale.js';
import { resolveOnMedia, type OnMediaOverrides, type ResolvedOnMedia } from './on-media-tokens.js';
import { registerTheme } from './theme-registry.js';
import type { SyntaxThemeDefinition } from './syntax/define-syntax-theme.js';
import type { IconRegistry } from '../components/icon/icon-registry.js';
import type { IndicatorRegistry } from '../components/indicator/types.js';

/**
 * Ported from Astryx's `src/theme/defineTheme.ts`, covering the surface the
 * shipped themes exercise.
 *
 * **Nothing is omitted from this shape any more.** Three fields were on a
 * "deferred because no shipped theme uses it" list and all three came off it,
 * none on the terms the list assumed. The **radius expander** went when the y2k
 * theme turned out to use it. The HCT-generative **`color`** field went when a
 * surface audit found `theme/index.ts` missing `expandColorScale` entirely.
 * **`extends`** was the last, and it was the worst of the three: the CLI's
 * shipped `theme.doc.mjs` had been documenting it — upstream's prose, carried
 * over verbatim — so it was not a quiet gap a consumer might never notice but a
 * documented feature that silently did nothing.
 *
 * The lesson those three earned together: "no shipped theme uses it" is a claim
 * about this repo's themes, and it says nothing about what the published surface
 * promises or what a consumer's theme will reach for.
 *
 * `color` had to arrive with all three of its pieces at once —
 * `expandColorScale`, its `hct` helpers and `contrast.ts` — but only
 * `contrast.ts` is genuinely new in upstream's 0.3.0. `expandColorScale` dates
 * to v0.0.13 (`ddc384c0d`) and `hct` likewise predates v0.2.0, so the expander
 * was an old gap that had *additionally* accumulated substantial 0.3.0 change.
 * Two things changed there. `accent` became optional: an accent-less config
 * seeds the neutral ramp from the default accent's hue (`#0064E0`) and leaves
 * `--color-accent`, `--color-accent-muted` and `--color-on-accent`
 * *ungenerated*, so they fall through to the token defaults. And
 * `--color-border-emphasized` is now tone-bumped until it clears 3:1 against
 * the generated surface (WCAG 1.4.11) — porting the expander without the
 * contrast half emits borders that fail it. **No oracle here would catch
 * that**: all five ported themes declare that token literally, so nothing this
 * repo builds passes through the generator at all.
 */

/** A token value: one string, or a [light, dark] pair compiled to light-dark(). */
export type TokenValue = string | readonly [light: string, dark: string];

/**
 * Upstream declares its flat `tokenDefaults` map here. Ours lives in
 * `./tokens.ts` instead, and the reason is structural rather than stylistic:
 * building it means importing `styles/tokens.stylex.ts`, and this package ships
 * its `.stylex.js` modules **uncompiled** for the consumer's StyleX plugin — so
 * a plain-Node importer of that module hits a runtime `stylex.defineVars` and
 * throws. This file is loaded under plain Node (the theme build reads
 * `generate-theme-rules.js`, which imports it), and must stay clear of StyleX.
 * Upstream has no such constraint: its published `dist/` is already compiled.
 */

export type TokenMap = Record<string, TokenValue>;

/**
 * One style key's declarations. A `:`-prefixed key holds a nested block applied
 * under that pseudo-class, so a theme can restyle an interaction state without
 * the component having to publish a custom property for it.
 */
export type StyleOverrides = Record<string, TokenValue | TokenMap>;

/** Component overrides, keyed by style key (see parseStyleKey). */
export type ComponentOverrides = Record<string, Record<string, StyleOverrides>>;

/**
 * SYNC: `ThemeConfig` is the theme surface. Adding, removing, or renaming a
 * field means updating:
 * - /packages/cli/assets/theme.template.ts (documents every field; the drift
 *   guard is packages/cli/scripts/check-theme-template.test.mjs)
 * - /packages/cli/assets/docs/theme.doc.mjs (`astryx-svelte docs theme`)
 */
export interface ThemeConfig {
	name: string;
	typography?: TypographyConfig;
	/** Border-radius scale. Expanded to the `--radius-*` tokens. */
	radius?: RadiusScaleConfig;
	motion?: MotionScaleConfig;
	/**
	 * Color scale configuration. Generates color token overrides from a single
	 * accent color using the HCT perceptual color model.
	 *
	 * Only generates tokens derivable from the accent — status colors,
	 * categorical hues, and fixed tokens (on-dark/on-light) use defaults.
	 * Explicit `tokens` entries always take precedence.
	 *
	 * `accent` is optional — omit it for a neutral-only theme, which keeps the
	 * default accent tokens and only themes the neutrals.
	 *
	 * @example
	 * ```ts
	 * color: { accent: '#0064E0', neutralStyle: 'cool', contrast: 'standard' }
	 *
	 * // Neutral-only — accent tokens stay at their defaults
	 * color: { neutralStyle: 'warm' }
	 * ```
	 */
	color?: ColorScaleConfig;
	/**
	 * Default syntax highlighting theme for code components. Sets the
	 * `--color-syntax-*` tokens at the theme root; a `<SyntaxTheme>` further in
	 * overrides them for its subtree.
	 *
	 * @example
	 * ```ts
	 * import { dracula } from '@astryx-svelte/core/theme/syntax';
	 * defineTheme({ name: 'my-theme', syntax: dracula });
	 * ```
	 */
	syntax?: SyntaxThemeDefinition;
	/**
	 * Base theme to extend. The new theme starts with the base theme's tokens,
	 * components, icons and indicators, then applies this input's own on top —
	 * the base always has lowest precedence, and `name` is always the child's.
	 *
	 * Use it to build a variant that customises a few aspects without restating a
	 * whole theme.
	 *
	 * Only the four merged keys inherit. `syntax`, `onDark` and `onLight` do not,
	 * which is upstream's behaviour and not an oversight here: `syntax` folds into
	 * the token map before this point, so it inherits through `resolvedTokens`
	 * anyway, and the on-media maps are resolved unconditionally from the port's
	 * own defaults for every theme.
	 *
	 * @example
	 * ```ts
	 * import { neutralTheme } from '@astryx-svelte/theme-neutral';
	 *
	 * const myTheme = defineTheme({
	 * 	name: 'my-brand',
	 * 	extends: neutralTheme,
	 * 	icons: myIcons,
	 * 	tokens: { '--color-accent': '#FF0000' }
	 * });
	 * ```
	 */
	extends?: DefinedTheme;
	tokens?: TokenMap;
	components?: ComponentOverrides;
	/**
	 * Icon registry — semantic icon names mapped to snippets, scoped to this
	 * theme.
	 *
	 * `Icon` and `useIcon` resolve these from the nearest `<Theme>` before
	 * falling through to the global `registerIcons` map and the built-in
	 * defaults, so two nested themes each render their own glyphs. `<Theme>`
	 * used to hand them to `registerIcons` instead — a document-wide write that
	 * made the last theme mounted win — and upstream removed that at 0.3.0.
	 */
	icons?: Partial<IconRegistry>;
	/**
	 * Indicator overrides — replaces the components that draw stateful control
	 * visuals with the theme's own, by name.
	 *
	 * Replacement is by indicator name, not per call site, so a single entry
	 * reaches every component that draws that indicator: mapping `check` to
	 * `RadioIndicator` gives radio visuals to every single-selection mark in the
	 * app.
	 *
	 * Each entry is checked against its indicator's family, so a replacement
	 * must accept the states that family passes.
	 */
	indicators?: IndicatorRegistry;
	/** Additions to the defaults for content on a dark surface (`<MediaTheme>`). */
	onDark?: OnMediaOverrides;
	/** Additions to the defaults for content on a light surface. Same shape as `onDark`. */
	onLight?: OnMediaOverrides;
}

export interface DefinedTheme extends ThemeConfig {
	/** Tokens after expanding the typography and motion scales. */
	readonly resolvedTokens: Record<string, string>;
	/**
	 * Set on a theme whose CSS ships as a separate file (this repo's
	 * `scripts/build-theme.mjs`, upstream's `astryx theme build`). `<Theme>`
	 * skips runtime style injection for one, since the stylesheet is already
	 * there. `defineTheme` never sets it — the build artifact does, as upstream's
	 * does.
	 */
	readonly __built?: true;
	/**
	 * On-media overrides after merging the theme's `onDark` over the defaults.
	 * Always present — the defaults apply whether or not a theme names them.
	 * @internal
	 */
	readonly __onDark: ResolvedOnMedia;
	/** As `__onDark`, for the light surface. @internal */
	readonly __onLight: ResolvedOnMedia;
}

/** Compiles a `[light, dark]` pair into `light-dark()`; passes strings through. */
export function resolveTokenValue(value: TokenValue): string {
	return Array.isArray(value) ? `light-dark(${value[0]}, ${value[1]})` : (value as string);
}

function resolveTokenMap(tokens: TokenMap | undefined): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [name, value] of Object.entries(tokens ?? {})) {
		out[name] = resolveTokenValue(value);
	}
	return out;
}

/**
 * Flattens a syntax theme into `--color-syntax-<role>` entries, which join the
 * colour namespace rather than forming one of their own.
 */
function syntaxTokenMap(syntax: SyntaxThemeDefinition | undefined): Record<string, string> {
	const tokens: Record<string, string> = {};
	for (const [name, value] of Object.entries(syntax?.tokens ?? {})) {
		tokens[`--color-syntax-${name}`] = value;
	}
	return tokens;
}

/**
 * Upstream's `deepMergeComponents`. Merges two component maps **three levels
 * deep** — component, then style key, then the declarations within it — so an
 * override that names one property of a generated style key keeps the rest.
 *
 * The depth is the whole point, and this port had it one level too shallow: a
 * theme writing `text: {'type:display-1': {fontFamily}}` (butter, gothic and
 * y2k all do, to put a display face on the largest three sizes) replaced the
 * generated entry outright and silently dropped the `fontSize` and `lineHeight`
 * bindings with it — six missing declarations per theme, and a display heading
 * that fell back to the component's compiled default size. Neutral never
 * exercised it: none of its `components` keys collide with a generated one.
 */
function deepMergeComponents(
	base: ComponentOverrides,
	overrides: ComponentOverrides | undefined
): ComponentOverrides {
	if (!overrides) return base;

	const result: ComponentOverrides = {};
	for (const [component, styleKeys] of Object.entries(base)) {
		result[component] = { ...styleKeys };
	}

	for (const [component, styleKeys] of Object.entries(overrides)) {
		if (!result[component]) {
			result[component] = { ...styleKeys };
			continue;
		}
		for (const [styleKey, styles] of Object.entries(styleKeys)) {
			result[component][styleKey] = { ...result[component][styleKey], ...styles };
		}
	}

	return result;
}

/**
 * Resolves a theme definition into its final token map.
 *
 * Precedence matches upstream's `defineTheme` step order exactly: generated
 * scales, then `syntax`, then the author's explicit `tokens`. An explicit
 * override always beats both an expander and the syntax theme — so a theme that
 * sets `syntax: dracula` *and* its own `--color-syntax-keyword` gets its own.
 *
 * The syntax fold happens **here** rather than at CSS-emit time: doing it in
 * `generateThemeCss` put it after `config.tokens` and inverted that precedence,
 * and it also left `resolvedTokens` — a public readonly field — missing entries
 * upstream's equivalent map contains.
 */
export function defineTheme(config: ThemeConfig): DefinedTheme {
	// Step 0, as upstream numbers it: pre-seed from the base theme so everything
	// below overwrites it. `base.resolvedTokens` and not `base.tokens` — upstream
	// has one token map and this port has two, and the resolved one is the
	// counterpart (see the note in `tokens.ts`). Seeding the raw map instead would
	// inherit only what the base's author typed by hand and silently drop every
	// token its expanders generated.
	const base = config.extends;

	const resolvedTokens: Record<string, string> = {
		...base?.resolvedTokens,
		// Colour leads, as upstream's step order has it — its step 1, ahead of the
		// type scale. No generated key namespace actually collides (colour emits
		// `--color-*`, and the syntax fold below owns `--color-syntax-*` alone), so
		// today the position is parity rather than behaviour; it stops being inert
		// the moment an expander grows into another's namespace.
		...(config.color ? expandColorScale(config.color) : {}),
		...(config.typography ? expandTypeScale(config.typography) : {}),
		// Radius sits between the type scale and motion, as upstream's step order
		// has it — all three are expanders, so the order only matters against
		// `config.tokens`, which wins over every one of them.
		...(config.radius ? expandRadiusScale(config.radius) : {}),
		...(config.motion ? expandMotionScale(config.motion) : {}),
		...syntaxTokenMap(config.syntax),
		...resolveTokenMap(config.tokens)
	};

	// Generated component bindings first, so a theme's own `components` entry for
	// the same style key still wins — upstream's precedence. Colours are
	// unconditional; the type-scale bindings need a scale to reference.
	const generated: Record<
		string,
		Record<string, Record<string, string>>
	> = generateTextColorComponents();
	if (config.typography?.scale) {
		for (const [name, styles] of Object.entries(generateTypeScaleComponents())) {
			generated[name] = { ...generated[name], ...styles };
		}
	}

	let components = deepMergeComponents(generated, config.components);
	// The base goes underneath the whole generated-then-explicit stack, not
	// alongside it — upstream's step 3 ordering. A child's own entry for a style
	// key still wins, and so does a generated one.
	if (base?.components) {
		components = deepMergeComponents(base.components, components);
	}

	// Icons and indicators merge one level deep, keyed by name: a child that
	// replaces `check` keeps every other glyph the base registered.
	const icons =
		config.icons && base?.icons
			? { ...base.icons, ...config.icons }
			: (config.icons ?? base?.icons);
	const indicators =
		config.indicators && base?.indicators
			? { ...base.indicators, ...config.indicators }
			: (config.indicators ?? base?.indicators);

	const theme: DefinedTheme = {
		...config,
		// After the spread, so the merged values win over the child's own raw ones.
		// `name` deliberately is not merged: it comes from the spread, so a child
		// always keeps its own.
		icons,
		indicators,
		components,
		resolvedTokens,
		// Resolved unconditionally: the on-media defaults are what make
		// `<MediaTheme>` work at all, so a theme that says nothing about media
		// surfaces still emits them.
		__onDark: resolveOnMedia('dark', config.onDark),
		__onLight: resolveOnMedia('light', config.onLight)
	};

	// Defining a theme registers it, so a name-keyed lookup (`getIcon(name,
	// 'brand')`) resolves without a `<Theme>` having mounted. Upstream's, added
	// at 0.3.0 alongside the registry.
	registerTheme(theme);
	return theme;
}
