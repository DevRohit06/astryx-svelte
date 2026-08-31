import { NAMESPACE, cssVar, dataAttr, stableClassName } from '../internal/naming.js';
import { getDerivedVars } from './derived-var-registry.js';
import { dataTokenDefaults } from './domain-tokens/data-tokens.js';
import { parseStyleKey } from './parse-style-key.js';
import {
	resolveTokenValue,
	type DefinedTheme,
	type StyleOverrides,
	type TokenMap,
	type TokenValue
} from './define-theme.js';

/**
 * Ported from Astryx's `src/theme/generateThemeRules.ts`.
 *
 * Emits a theme's CSS. Two properties of the output are load-bearing:
 *
 * 1. **`@scope`** to the theme's data attribute, bounded by the next
 *    `[data-astryx-theme]`, so nesting two themes doesn't bleed. Note this is
 *    the narrowest browser requirement in the whole system — `@scope` only
 *    reached Baseline in December 2025.
 * 2. **`@layer astryx-theme`**, which sits above the StyleX layers so a theme's
 *    component overrides beat component styles without specificity hacks.
 */

const THEME_ATTR = dataAttr('theme');
const THEME_SCOPE_TO = `[${THEME_ATTR}]`;
const THEME_LAYER = `${NAMESPACE}-theme`;
const BASE_LAYER = `${NAMESPACE}-base`;

/** `[data-astryx-media="dark"]` — what `<MediaTheme>` writes. */
function mediaSelector(surface: 'dark' | 'light'): string {
	return `[${dataAttr('media')}="${surface}"]`;
}

function indent(text: string, by = '\t'): string {
	return text
		.split('\n')
		.map((line) => (line.length > 0 ? by + line : line))
		.join('\n');
}

function declarations(tokens: Record<string, string>): string {
	return Object.entries(tokens)
		.map(([name, value]) => `${name}: ${value};`)
		.join('\n');
}

/** `backgroundColor` → `background-color`. Custom properties pass through. */
function toCssProperty(name: string): string {
	if (name.startsWith('--')) return name;
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Padding properties that trigger container token mapping. */
const PADDING_PROPS = new Set([
	'padding',
	'paddingBlock',
	'paddingInline',
	'paddingBlockStart',
	'paddingBlockEnd',
	'paddingInlineStart',
	'paddingInlineEnd'
]);

/**
 * Physical block-axis longhands, and the logical longhand each one *is* in every
 * horizontal writing mode. Normalising them costs no direction assumption, which
 * is why they can join the container expansion.
 *
 * `paddingLeft`/`paddingRight` are deliberately absent. They are
 * direction-relative — left is inline-start in LTR and inline-end in RTL — and
 * the expansion's tokens are consumed by logical properties, so mapping them
 * would put the padding on the opposite edge in RTL. They keep their physical
 * meaning and land on the element as `padding-left`/`padding-right`; the cost is
 * that a component's internals cannot see them.
 */
const PHYSICAL_BLOCK_PADDING_PROPS: Record<string, string> = {
	paddingTop: 'paddingBlockStart',
	paddingBottom: 'paddingBlockEnd'
};

/**
 * Every padding spelling the container expansion consumes. Kept separate from
 * `PADDING_PROPS`, which also routes longhands to `vars`-style derived entries —
 * those carry one value for the whole box, so a single physical edge must not
 * reach them.
 */
const CONTAINER_PADDING_PROPS = new Set([
	...PADDING_PROPS,
	...Object.keys(PHYSICAL_BLOCK_PADDING_PROPS)
]);

interface ParsedPadding {
	blockStart?: string;
	blockEnd?: string;
	inline?: string;
	inlineStart?: string;
	inlineEnd?: string;
}

/**
 * Parses CSS padding shorthand/longhand into block/inline values. Supports the
 * 1–3 value shorthands, the logical longhands, and the physical block longhands
 * normalised by `PHYSICAL_BLOCK_PADDING_PROPS`, as upstream's does.
 */
function parsePadding(props: [string, string][]): ParsedPadding {
	const result: ParsedPadding = {};

	for (const [rawProp, value] of props) {
		const prop = PHYSICAL_BLOCK_PADDING_PROPS[rawProp] ?? rawProp;
		switch (prop) {
			case 'padding': {
				const parts = value.trim().split(/\s+/);
				if (parts.length === 1) {
					result.blockStart = parts[0];
					result.blockEnd = parts[0];
					result.inline = parts[0];
				} else if (parts.length === 2) {
					result.blockStart = parts[0];
					result.blockEnd = parts[0];
					result.inline = parts[1];
				} else if (parts.length >= 3) {
					result.blockStart = parts[0];
					result.inline = parts[1];
					result.blockEnd = parts[2];
				}
				break;
			}
			case 'paddingBlock': {
				const parts = value.trim().split(/\s+/);
				result.blockStart = parts[0];
				result.blockEnd = parts[1] ?? parts[0];
				break;
			}
			case 'paddingInline': {
				const parts = value.trim().split(/\s+/);
				if (parts.length === 1) {
					result.inline = parts[0];
				} else {
					result.inlineStart = parts[0];
					result.inlineEnd = parts[1];
				}
				break;
			}
			case 'paddingBlockStart':
				result.blockStart = value;
				break;
			case 'paddingBlockEnd':
				result.blockEnd = value;
				break;
			case 'paddingInlineStart':
				result.inlineStart = value;
				break;
			case 'paddingInlineEnd':
				result.inlineEnd = value;
				break;
		}
	}

	return result;
}

/**
 * Expands parsed padding into the component-scoped public tokens
 * (`--astryx-card-padding` and its directional siblings), which
 * `container.stylex.ts` reads through inverted `var()` fallbacks — so the theme
 * sets a value and the component picks it up through the custom-property
 * cascade, with no layer competition against the compiled StyleX.
 *
 * All four sides equal collapses to the shorthand token alone, which is the
 * shape neutral's `card`/`section` padding produced back when this file handled
 * only the one-value case.
 */
function expandContainerPadding(component: string, parsed: ParsedPadding): [string, string][] {
	const prefix = cssVar(`${component}-padding`);
	const tokens: [string, string][] = [];

	// inlineStart/inlineEnd override the symmetric `inline` value.
	const effectiveInlineStart = parsed.inlineStart ?? parsed.inline;
	const effectiveInlineEnd = parsed.inlineEnd ?? parsed.inline;
	const inlineSymmetric =
		effectiveInlineStart != null &&
		effectiveInlineEnd != null &&
		effectiveInlineStart === effectiveInlineEnd;

	const allSame =
		inlineSymmetric &&
		parsed.blockStart != null &&
		parsed.blockEnd != null &&
		effectiveInlineStart === parsed.blockStart &&
		parsed.blockStart === parsed.blockEnd;

	if (allSame) {
		tokens.push([prefix, effectiveInlineStart ?? '']);
		return tokens;
	}

	if (parsed.inlineStart != null || parsed.inlineEnd != null) {
		// Asymmetric inline — start and end separately.
		if (effectiveInlineStart != null) {
			tokens.push([`${prefix}-inline-start`, effectiveInlineStart]);
		}
		if (effectiveInlineEnd != null) {
			tokens.push([`${prefix}-inline-end`, effectiveInlineEnd]);
		}
	} else if (parsed.inline != null) {
		tokens.push([`${prefix}-inline`, parsed.inline]);
	}
	if (parsed.blockStart != null) {
		tokens.push([`${prefix}-block-start`, parsed.blockStart]);
	}
	if (parsed.blockEnd != null) {
		tokens.push([`${prefix}-block-end`, parsed.blockEnd]);
	}

	return tokens;
}

/**
 * Applies the derived-var registry to one style key's resolved declarations.
 *
 * Two independent things happen, in upstream's order:
 *
 * 1. **Derived vars are additive.** `card: {borderRadius}` emits *both*
 *    `border-radius` and `--_card-radius`; the component reads the second, and
 *    the first is what a plain `.astryx-card` selector needs to look right.
 * 2. **Container padding replaces.** A component registered with
 *    `expand: 'container'` has its padding properties removed and swapped for
 *    the `--astryx-<component>-padding*` tokens.
 */
function applyDerivedVars(component: string, props: [string, string][]): [string, string][] {
	const derivedProps: [string, string][] = [];
	// Source properties an entry marked `replaces` consumed, so they can be
	// dropped from the emitted rule rather than sitting beside their var.
	const replacedProps = new Set<string>();
	let containerExpanded = false;

	for (const [prop, value] of props) {
		// Padding longhands match the registry's `padding` entry too, so
		// `paddingBlock` alone still triggers the container expansion.
		const paddingDerived =
			PADDING_PROPS.has(prop) && prop !== 'padding' ? getDerivedVars(component, 'padding') : [];

		for (const entry of [...getDerivedVars(component, prop), ...paddingDerived]) {
			if (entry.expand === 'container' && PADDING_PROPS.has(prop)) {
				containerExpanded = true;
			}
			if (entry.replaces === true) {
				replacedProps.add(prop);
			}
			for (const varName of entry.vars ?? []) {
				derivedProps.push([varName, value]);
			}
		}

		// A physical block longhand reaches the container expansion only. It names
		// one edge, so it must not feed a `vars` entry above, which carries the
		// padding for the whole box.
		if (
			prop in PHYSICAL_BLOCK_PADDING_PROPS &&
			getDerivedVars(component, 'padding').some((e) => e.expand === 'container')
		) {
			containerExpanded = true;
		}
	}

	let finalProps = props;
	if (containerExpanded) {
		const parsed = parsePadding(props.filter(([p]) => CONTAINER_PADDING_PROPS.has(p)));
		finalProps = [
			...props.filter(([p]) => !CONTAINER_PADDING_PROPS.has(p)),
			...expandContainerPadding(component, parsed)
		];
	}

	if (replacedProps.size > 0) {
		finalProps = finalProps.filter(([p]) => !replacedProps.has(p));
	}

	return [...finalProps, ...derivedProps];
}

/**
 * Guard appended to a themed `:hover` rule so it cannot match a disabled
 * element.
 *
 * A theme authoring `':hover': {backgroundColor: …}` is describing the enabled
 * control; `:hover` on its own would paint that background on a disabled one
 * too, because browsers suppress a disabled control's events, not its hover
 * styling. `:where()` contributes no specificity, so a themed hover rule still
 * weighs exactly what it weighed before.
 *
 * Mirrors upstream's `@astryx/no-hover-on-disabled` lint rule, which enforces
 * the same guard on the components' own StyleX styles.
 */
const HOVER_DISABLED_GUARD = ':where(:not(:disabled,[aria-disabled="true"]))';

/** Insert the disabled guard into a `:hover` pseudo, keeping any pseudo-element last. */
function guardHoverPseudo(pseudo: string): string {
	if (!/^:hover(?![-\w])/.test(pseudo) || pseudo.includes('[aria-disabled')) {
		return pseudo;
	}
	const pseudoElement = pseudo.indexOf('::');
	return pseudoElement === -1
		? pseudo + HOVER_DISABLED_GUARD
		: pseudo.slice(0, pseudoElement) + HOVER_DISABLED_GUARD + pseudo.slice(pseudoElement);
}

/**
 * Splits one style key's declarations into the properties that apply to the
 * element and the `:`-prefixed blocks that apply under a pseudo-class.
 *
 * A pseudo block is a nested object, so the discriminator is the key's leading
 * colon plus the value's type — a token value is a string or a `[light, dark]`
 * pair, never a bare object.
 */
function splitPseudos(styles: StyleOverrides): {
	props: [string, TokenValue][];
	pseudos: [string, TokenMap][];
} {
	const props: [string, TokenValue][] = [];
	const pseudos: [string, TokenMap][] = [];

	for (const [name, value] of Object.entries(styles)) {
		if (name.startsWith(':') && typeof value === 'object' && !Array.isArray(value)) {
			pseudos.push([name, value as TokenMap]);
		} else {
			props.push([name, value as TokenValue]);
		}
	}

	return { props, pseudos };
}

/**
 * One style key's element-level declarations: token values resolved, the
 * derived-var registry applied, then kebab-cased for output.
 */
function elementDeclarations(component: string, props: [string, TokenValue][]) {
	const expanded = applyDerivedVars(
		component,
		props.map(([name, value]) => [name, resolveTokenValue(value)] as [string, string])
	);

	const resolved: Record<string, string> = {};
	for (const [name, value] of expanded) {
		resolved[toCssProperty(name)] = value;
	}
	return resolved;
}

/** A pseudo block's declarations, kebab-cased and resolved. */
function pseudoDeclarations(tokens: TokenMap): Record<string, string> {
	const resolved: Record<string, string> = {};
	for (const [name, value] of Object.entries(tokens)) {
		resolved[toCssProperty(name)] = resolveTokenValue(value);
	}
	return resolved;
}

/**
 * Component overrides become plain CSS keyed off the stable class that
 * `themeProps()` renders, e.g.
 *
 *   components.button['variant:destructive'] → `.astryx-button.destructive`
 *
 * A pseudo-class block becomes a second rule on the same selector. Upstream
 * distributes the pseudo across a comma-separated selector list; neither
 * `stableClassName` nor `parseStyleKey` can produce one, so appending it is the
 * same thing here. A `:hover` pseudo picks up the disabled guard on the way —
 * see `guardHoverPseudo`.
 */
function componentRules(theme: DefinedTheme): string[] {
	const rules: string[] = [];

	for (const [component, styleKeys] of Object.entries(theme.components ?? {})) {
		const base = `.${stableClassName(component)}`;

		for (const [styleKey, styles] of Object.entries(styleKeys)) {
			const selector = `${base}${parseStyleKey(styleKey)}`;
			const { props, pseudos } = splitPseudos(styles);

			const resolved = elementDeclarations(component, props);
			if (Object.keys(resolved).length > 0) {
				rules.push(`${selector} {\n${indent(declarations(resolved))}\n}`);
			}

			for (const [pseudo, styleBlock] of pseudos) {
				const block = pseudoDeclarations(styleBlock);
				if (Object.keys(block).length === 0) continue;
				rules.push(`${selector}${guardHoverPseudo(pseudo)} {\n${indent(declarations(block))}\n}`);
			}
		}
	}

	rules.push(...sizeOverrideRules(theme));

	return rules;
}

/**
 * Text `size` values mapped to their raw font-size token.
 *
 * Mirrors `sizeStyles` in `components/text/text.stylex.ts` — note that `xsm`
 * resolves to `--font-size-xs`, not `--font-size-xsm`.
 */
const TEXT_SIZE_TOKEN_MAP: Record<string, string> = {
	'4xs': 'var(--font-size-4xs)',
	'3xs': 'var(--font-size-3xs)',
	'2xs': 'var(--font-size-2xs)',
	xsm: 'var(--font-size-xs)',
	sm: 'var(--font-size-sm)',
	base: 'var(--font-size-base)',
	lg: 'var(--font-size-lg)',
	xl: 'var(--font-size-xl)',
	'2xl': 'var(--font-size-2xl)',
	'3xl': 'var(--font-size-3xl)',
	'4xl': 'var(--font-size-4xl)'
};

/**
 * `size`-prop font-size overrides for Text.
 *
 * `size` is documented as a font-size override that wins over the size implied
 * by `type`. Its StyleX class lives in `@layer astryx-base`, but a theme's
 * per-type font-size rule (`.astryx-text.<type>`) lives in the higher
 * `@layer astryx-theme`, so the layer cascade let the theme silently shadow
 * `size` for any `type` the theme styled. Re-emitting the size classes here —
 * same layer as the type rules, same `.astryx-text.<x>` specificity, later in
 * source — restores `size` as a real override.
 *
 * Only `font-size` is overridden; line-height and the other type properties are
 * deliberately preserved, matching the prop's documented contract.
 *
 * Gated on the theme touching `text` (which includes the auto-generated
 * type-scale rules) — with no theme type rule to beat, the base-layer StyleX
 * class already wins and no override is needed.
 */
function sizeOverrideRules(theme: DefinedTheme): string[] {
	if (!theme.components || !('text' in theme.components)) return [];

	const base = `.${stableClassName('text')}`;
	return Object.entries(TEXT_SIZE_TOKEN_MAP).map(
		([size, value]) => `${base}${parseStyleKey(`size:${size}`)} {\n\tfont-size: ${value};\n}`
	);
}

/**
 * CSS for the on-media surfaces — the token and component overrides that apply
 * inside a `<MediaTheme>`.
 *
 * Kept in its own `@scope` block, as upstream does, rather than folded into the
 * main one: it is generated from `__onDark`/`__onLight` rather than from the
 * theme's own tokens, and a theme with no component overrides at all still
 * emits it.
 */
function onMediaRules(theme: DefinedTheme): string[] {
	const rules: string[] = [];

	for (const surface of ['dark', 'light'] as const) {
		const onMedia = surface === 'dark' ? theme.__onDark : theme.__onLight;
		if (!onMedia) continue;

		const media = mediaSelector(surface);

		if (Object.keys(onMedia.tokens).length > 0) {
			rules.push(`${media} {\n${indent(declarations(onMedia.tokens))}\n}`);
		}

		for (const [component, styleKeys] of Object.entries(onMedia.components ?? {})) {
			for (const [styleKey, styles] of Object.entries(styleKeys)) {
				// `:is()` on both halves so the media context and the component class
				// each contribute their own specificity, rather than the descendant
				// combinator's sum deciding which surface wins.
				const selector =
					`:is(${media}) ` + `:is(.${stableClassName(component)}${parseStyleKey(styleKey)})`;
				const { props, pseudos } = splitPseudos(styles);

				const resolved = elementDeclarations(component, props);
				if (Object.keys(resolved).length > 0) {
					rules.push(`${selector} {\n${indent(declarations(resolved))}\n}`);
				}

				for (const [pseudo, styleBlock] of pseudos) {
					const block = pseudoDeclarations(styleBlock);
					if (Object.keys(block).length === 0) continue;
					rules.push(`${selector}${guardHoverPseudo(pseudo)} {\n${indent(declarations(block))}\n}`);
				}
			}
		}
	}

	return rules;
}

/**
 * The on-media block on its own, as upstream's `generateOnMediaCSS` exposes it.
 *
 * Returns the empty string when there is nothing to emit, so a caller can test
 * it before wrapping it in a layer.
 */
export function generateOnMediaCSS(theme: DefinedTheme): string {
	const rules = onMediaRules(theme);
	if (rules.length === 0) return '';

	const scopeSelector = `[${THEME_ATTR}="${theme.name}"]`;
	return `@scope (${scopeSelector}) to (${THEME_SCOPE_TO}) {\n${indent(rules.join('\n\n'))}\n}`;
}

/**
 * Upstream's `@layer reset` prose block: the theme's typography and text
 * colours applied to *bare* HTML elements.
 *
 * Without it a `<p>` or `<h2>` that is not a `Text`/`Heading` component — docs
 * prose, anything inside a copied example — misses the theme entirely: no
 * `--color-text-primary`, no heading family, no scale. That is a colour
 * difference the token oracle cannot see, because every token it compares is
 * present and correct; they were simply never applied to anything.
 *
 * Generated from the resolved type scale rather than hardcoded, so a theme that
 * retunes `scale` or overrides a heading weight gets a matching reset — which is
 * how upstream's neutral theme ends up with `bold` h3/h4 here.
 *
 * A theme with no type scale still gets the whole block, with each size/weight
 * falling back to `var(--text-…)` — upstream's `val()` helper, restored here
 * after this port had guarded the block behind `--text-body-size` and emitted
 * nothing for such a theme. The guard was invisible to every check we have:
 * all eight shipped themes declare `typography`, so the branch never fired and
 * the token oracles (which diff declarations, not their absence) could not see
 * it. `astryx-svelte theme build` is what surfaced it — a theme that overrides
 * one colour token got no `@layer reset` at all, so its bare `<p>` kept the
 * ambient theme's typography *and* its text colour.
 */
function proseResetRules(theme: DefinedTheme): string[] {
	const tokens = theme.resolvedTokens;

	/**
	 * A token's literal value, or a `var()` reference to it when this theme does
	 * not set it. Upstream's `val`.
	 */
	const val = (key: string) => tokens[key] || `var(${key})`;

	/** The three semantic tokens for a role. */
	const role = (name: string) => ({
		'font-size': val(`--text-${name}-size`),
		'font-weight': val(`--text-${name}-weight`),
		'line-height': val(`--text-${name}-leading`)
	});

	const rules: string[] = [
		`:where(h1, h2, h3, h4, h5, h6) {\n${indent(
			declarations({
				'font-family': 'var(--font-family-heading)',
				color: 'var(--color-text-primary)'
			})
		)}\n}`
	];

	for (const level of [1, 2, 3, 4, 5, 6]) {
		rules.push(`:where(h${level}) {\n${indent(declarations(role(`heading-${level}`)))}\n}`);
	}

	rules.push(
		`:where(p) {\n${indent(
			declarations({
				'font-family': 'var(--font-family-body)',
				...role('body'),
				color: 'var(--color-text-primary)'
			})
		)}\n}`
	);

	rules.push(
		`:where(small) {\n${indent(
			declarations({ ...role('supporting'), color: 'var(--color-text-secondary)' })
		)}\n}`
	);

	// Upstream emits family, size and leading for code — no weight.
	rules.push(
		`:where(code, pre) {\n${indent(
			declarations({
				'font-family': 'var(--font-family-code)',
				'font-size': val('--text-code-size'),
				'line-height': val('--text-code-leading')
			})
		)}\n}`
	);

	rules.push(
		`:where(hr) {\n${indent(
			declarations({ border: 'none', 'border-top': '1px solid var(--color-border)' })
		)}\n}`
	);

	return rules;
}

/**
 * A theme's rules split by the layer they belong in, as upstream's
 * `generateThemeRulesSplit` returns them.
 *
 * `prose` is the bare-element reset (`:where(h1, …)`, `:where(p)`) and belongs
 * in `@layer reset`, where any class-based style beats it. `component` is the
 * `:scope` token block plus every `.astryx-*` override, and belongs in
 * `@layer astryx-theme`, above StyleX.
 */
export interface ThemeRulesSplit {
	component: string[];
	prose: string[];
}

/**
 * A theme's rules, grouped by target layer but *not* wrapped in `@scope` or
 * `@layer` — the shape a caller that composes its own stylesheet needs.
 *
 * Upstream splits one flat `generateThemeRules()` list by testing each rule for
 * a leading `:where(`; here the two groups are generated separately, so the
 * split is the grouping rather than a re-derivation of it. Same contract, and
 * it cannot misclassify a component rule that happens to start with `:where`.
 *
 * {@link generateThemeCss} is this plus the layer wrappers, and
 * `astryx-svelte theme build` is this plus its own — which is the whole point:
 * one generator, so a built stylesheet and the `<Theme>` runtime cannot drift.
 *
 * @param theme A theme returned by `defineTheme`.
 */
export function generateThemeRulesSplit(theme: DefinedTheme): ThemeRulesSplit {
	const component: string[] = [];

	// Scale-generated tokens, syntax colours and author overrides all land in one
	// :scope block, matching upstream's output. They are already merged, in
	// upstream's precedence order, by `defineTheme` — merging syntax in here
	// instead would put it *after* the author's explicit `tokens` and let a
	// `syntax:` preset silently beat an explicit `--color-syntax-*` override.
	const scopeTokens = theme.resolvedTokens;
	if (Object.keys(scopeTokens).length > 0) {
		component.push(`:scope {\n${indent(declarations(scopeTokens))}\n}`);
	}

	component.push(...componentRules(theme));

	return { component, prose: proseResetRules(theme) };
}

/**
 * A theme's rules as one flat list — upstream's `generateThemeRules(theme)`.
 *
 * Upstream generates this list and *derives* {@link generateThemeRulesSplit}
 * from it, by testing each rule for a leading `:where(`. This port generates the
 * two groups directly and concatenates them here, which was measured to agree
 * exactly: every rule in `prose` starts with `:where(`, no rule in `component`
 * does, and the size overrides already fall after the themed type rules they
 * have to beat on source order. Same list, reached from the other side.
 *
 * @param theme A theme returned by `defineTheme`.
 */
export function generateThemeRules(theme: DefinedTheme): string[] {
	const { component, prose } = generateThemeRulesSplit(theme);
	return [...component, ...prose];
}

/**
 * Output from {@link generateThemeCSS} — two CSS blocks for different layers.
 */
export interface ThemeCSSOutput {
	/**
	 * Prose element defaults scoped to the theme. Belongs in `@layer reset`,
	 * where any class-based style beats it. Empty string if there are no prose
	 * rules.
	 */
	prose: string;
	/**
	 * Token overrides and component `.astryx-*` overrides scoped to the theme.
	 * Belongs in `@layer astryx-theme`, above StyleX, so a theme can restyle a
	 * component on purpose. Empty string if there are no rules.
	 */
	component: string;
}

/**
 * The `--color-data-*` defaults as one unscoped `:root` block — upstream's
 * `generateDataTokenDefaultsCSS()`.
 *
 * Core tokens reach CSS once, at `:root`, from StyleX's `defineVars` output in
 * `@layer astryx-base`; a theme's own scope block then carries only the tokens
 * that theme overrides, which is why a nested theme inherits its parent's
 * override instead of shadowing it. Data tokens are not StyleX vars, so nothing
 * declares them — this is their equivalent, and callers put it in
 * `@layer astryx-base` so a theme's override wins by layer rather than by
 * specificity. Seeding it per theme scope instead re-declares the default
 * inside every nested theme, which is the shadowing this shape avoids.
 *
 * @internal Not exported from `@astryx-svelte/core/theme`, as upstream does not
 * export its counterpart: `<Theme>` is the only runtime caller, and the theme
 * build formats the same block from the public `dataTokenDefaults` — which is
 * why {@link generateThemeCss} calls this rather than re-deriving it.
 */
export function generateDataTokenDefaultsCSS(): string {
	return `:root {\n${indent(declarations(dataTokenDefaults))}\n}`;
}

/**
 * A theme's two `@scope` blocks, **without** layer wrappers — upstream's
 * `generateThemeCSS(theme)`, and the shape `<Theme>` consumes.
 *
 * Each caller decides which layer each block belongs in, because only the caller
 * knows whether it is writing a `<style>` element, a built stylesheet or a
 * document. {@link generateThemeCss} is this plus this port's layer wrappers and
 * a generated-file header; it is kept off the public barrel, because upstream
 * has no such export and the theme build scripts reach it by deep path.
 *
 * The blocks are joined without re-indenting, so every string
 * {@link generateThemeRules} returns appears verbatim in one of them.
 *
 * @param theme A theme returned by `defineTheme`.
 */
export function generateThemeCSS(theme: DefinedTheme): ThemeCSSOutput {
	const scopeSelector = `[${THEME_ATTR}="${theme.name}"]`;
	const scope = (rules: string[]): string =>
		`@scope (${scopeSelector}) to (${THEME_SCOPE_TO}) {\n${rules.join('\n\n')}\n}`;

	const { component, prose } = generateThemeRulesSplit(theme);

	const proseCss = prose.length > 0 ? scope(prose) : '';
	let componentCss = component.length > 0 ? scope(component) : '';

	// A separate block rather than another rule inside the first, matching
	// upstream: the on-media scope is unbounded so it can reach
	// `[data-astryx-media]` elements, which the bounded scope above cannot.
	const onMedia = generateOnMediaCSS(theme);
	if (onMedia) {
		componentCss = componentCss ? `${componentCss}\n\n${onMedia}` : onMedia;
	}

	return { prose: proseCss, component: componentCss };
}

/**
 * Generates the full stylesheet for a theme.
 *
 * @param theme A theme returned by `defineTheme`.
 */
export function generateThemeCss(theme: DefinedTheme): string {
	const scopeSelector = `[${THEME_ATTR}="${theme.name}"]`;

	const { component: blocks, prose } = generateThemeRulesSplit(theme);

	const inner = indent(blocks.join('\n\n'));
	const scoped = `@scope (${scopeSelector}) to (${THEME_SCOPE_TO}) {\n${inner}\n}`;

	const parts = [`/* @generated from the ${theme.name} theme definition — do not edit. */`, ''];

	// The prose reset goes first, in the `reset` layer, exactly as upstream
	// orders it — it must lose to both component styles and theme overrides.
	if (prose.length > 0) {
		const proseScoped =
			`@scope (${scopeSelector}) to (${THEME_SCOPE_TO}) {\n` + `${indent(prose.join('\n\n'))}\n}`;
		parts.push('@layer reset {', indent(proseScoped), '}', '');
	}

	// The data-token defaults are theme-independent and go in `@layer
	// astryx-base`, below the theme's own overrides. After the reset block and
	// before the theme block, as upstream's build orders it: a layer's position
	// is fixed by where it is *first declared*, so emitting this anywhere else
	// would invert `reset < astryx-base < astryx-theme` for a consumer who
	// imports this stylesheet on its own.
	parts.push(`@layer ${BASE_LAYER} {`, indent(generateDataTokenDefaultsCSS()), '}', '');

	parts.push(`@layer ${THEME_LAYER} {`, indent(scoped), '}');

	// A second layer block rather than another rule inside the first, matching
	// upstream: the on-media scope is generated separately and appended.
	const onMedia = generateOnMediaCSS(theme);
	if (onMedia) {
		parts.push('', `@layer ${THEME_LAYER} {`, indent(onMedia), '}');
	}

	parts.push('');
	return parts.join('\n');
}
