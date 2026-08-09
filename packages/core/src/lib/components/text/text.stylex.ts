import * as stylex from '@stylexjs/stylex';
import {
	colorVars,
	fontWeightVars,
	textSizeVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * Typography styles, ported from Astryx's `src/Text/text.stylex.ts`.
 *
 * Shared with Heading — upstream keeps a single style module for both so the two
 * cannot drift, and `heading.stylex.ts` imports these groups rather than
 * restating them.
 */

// =============================================================================
// Types
//
// Upstream keeps these in `theme/types.ts`. We follow the local convention of
// declaring a component's public unions beside its styles, since the styles are
// what give them meaning.
// =============================================================================

export type BuiltinTextType =
	| 'body'
	| 'large'
	| 'label'
	| 'supporting'
	| 'code'
	| 'display-1'
	| 'display-2'
	| 'display-3'
	| 'inherit';

/**
 * Semantic text type.
 *
 * Themes may define custom types via component overrides. Those render on the
 * `body` StyleX baseline and take their visual treatment from theme CSS
 * (`.astryx-text.<custom-type>`), which is why this stays open to any string.
 */
export type TextType = BuiltinTextType | (string & {});

export type TextSize =
	'4xs' | '3xs' | '2xs' | 'xsm' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

/**
 * Extensible colour map for `Text` and `Heading`.
 *
 * Theme packages add their own colours by augmenting this interface, and
 * `astryx theme build` generates the augmentation when it sees new `color:*`
 * values on a theme's Text/Heading overrides — the same seam `Token`, `Badge`
 * and `Button` carry.
 *
 * A custom colour renders as a stable class (`astryx-text.<color>` /
 * `astryx-heading.<color>`) that the theme's CSS paints, and falls back to the
 * `primary` StyleX baseline so it never renders unstyled — exactly how a custom
 * `type` falls back to `body`.
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface TextColorMap {
 *     brand: true;
 *     danger: true;
 *   }
 * }
 */
export interface TextColorMap {
	primary: true;
	secondary: true;
	disabled: true;
	placeholder: true;
	accent: true;
	inherit: true;
}

/**
 * The colours that ship with the design system, independent of theme
 * augmentation — used where a value has to be one of the real StyleX colour
 * styles (see {@link resolveStyleColor}).
 */
export type BuiltinTextColor =
	'primary' | 'secondary' | 'disabled' | 'placeholder' | 'accent' | 'inherit';

/** Text colour. Extensible via {@link TextColorMap}. */
export type TextColor = keyof TextColorMap;

export type TextDisplay = 'inline' | 'block';
export type WordBreak = 'break-word' | 'break-all';
export type TextWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty';
export type TextJustify = 'start' | 'center' | 'end';

// =============================================================================
// Colour
// =============================================================================

export const colorStyles = stylex.create({
	primary: { color: colorVars['--color-text-primary'] },
	secondary: { color: colorVars['--color-text-secondary'] },
	disabled: { color: colorVars['--color-text-disabled'] },
	placeholder: { color: colorVars['--color-text-secondary'] },
	accent: { color: colorVars['--color-text-accent'] },
	inherit: { color: 'inherit' }
});

// =============================================================================
// Weight
// =============================================================================

export const weightStyles = stylex.create({
	normal: { fontWeight: fontWeightVars['--font-weight-normal'] },
	medium: { fontWeight: fontWeightVars['--font-weight-medium'] },
	semibold: { fontWeight: fontWeightVars['--font-weight-semibold'] },
	bold: { fontWeight: fontWeightVars['--font-weight-bold'] }
});

// =============================================================================
// Default weight by type — mirrors the theme's type-scale tokens
// =============================================================================

export const defaultWeightByTypeStyles = stylex.create({
	body: { fontWeight: typeScaleVars['--text-body-weight'] },
	large: { fontWeight: typeScaleVars['--text-large-weight'] },
	label: { fontWeight: typeScaleVars['--text-label-weight'] },
	code: { fontWeight: typeScaleVars['--text-code-weight'] },
	supporting: { fontWeight: typeScaleVars['--text-supporting-weight'] },
	'display-1': { fontWeight: typeScaleVars['--text-display-1-weight'] },
	'display-2': { fontWeight: typeScaleVars['--text-display-2-weight'] },
	'display-3': { fontWeight: typeScaleVars['--text-display-3-weight'] },
	inherit: { fontWeight: 'inherit' }
});

// =============================================================================
// Baseline size/leading by type
//
// These make Text render correctly with no theme loaded at all. A theme's
// component overrides (`.astryx-text.body`, plus the reflected `data-type`) win
// when present, because `@scope` gives them higher specificity.
// =============================================================================

export const sizeByTypeStyles = stylex.create({
	body: {
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading']
	},
	large: {
		fontSize: typeScaleVars['--text-large-size'],
		lineHeight: typeScaleVars['--text-large-leading']
	},
	label: {
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading']
	},
	code: {
		fontSize: typeScaleVars['--text-code-size'],
		lineHeight: typeScaleVars['--text-code-leading'],
		fontFamily: typographyVars['--font-family-code']
	},
	supporting: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading']
	},
	'display-1': {
		fontSize: typeScaleVars['--text-display-1-size'],
		lineHeight: typeScaleVars['--text-display-1-leading']
	},
	'display-2': {
		fontSize: typeScaleVars['--text-display-2-size'],
		lineHeight: typeScaleVars['--text-display-2-leading']
	},
	'display-3': {
		fontSize: typeScaleVars['--text-display-3-size'],
		lineHeight: typeScaleVars['--text-display-3-leading']
	},
	inherit: { fontSize: 'inherit', lineHeight: 'inherit' }
});

// =============================================================================
// Explicit size override
// =============================================================================

export const sizeStyles = stylex.create({
	'4xs': { fontSize: textSizeVars['--font-size-4xs'] },
	'3xs': { fontSize: textSizeVars['--font-size-3xs'] },
	'2xs': { fontSize: textSizeVars['--font-size-2xs'] },
	xsm: { fontSize: textSizeVars['--font-size-xs'] },
	sm: { fontSize: textSizeVars['--font-size-sm'] },
	base: { fontSize: textSizeVars['--font-size-base'] },
	lg: { fontSize: textSizeVars['--font-size-lg'] },
	xl: { fontSize: textSizeVars['--font-size-xl'] },
	'2xl': { fontSize: textSizeVars['--font-size-2xl'] },
	'3xl': { fontSize: textSizeVars['--font-size-3xl'] },
	'4xl': { fontSize: textSizeVars['--font-size-4xl'] }
});

// =============================================================================
// Baseline size/leading by heading level — same rationale as sizeByTypeStyles
// =============================================================================

export const sizeByLevelStyles = stylex.create({
	1: {
		fontSize: typeScaleVars['--text-heading-1-size'],
		lineHeight: typeScaleVars['--text-heading-1-leading'],
		fontWeight: typeScaleVars['--text-heading-1-weight']
	},
	2: {
		fontSize: typeScaleVars['--text-heading-2-size'],
		lineHeight: typeScaleVars['--text-heading-2-leading'],
		fontWeight: typeScaleVars['--text-heading-2-weight']
	},
	3: {
		fontSize: typeScaleVars['--text-heading-3-size'],
		lineHeight: typeScaleVars['--text-heading-3-leading'],
		fontWeight: typeScaleVars['--text-heading-3-weight']
	},
	4: {
		fontSize: typeScaleVars['--text-heading-4-size'],
		lineHeight: typeScaleVars['--text-heading-4-leading'],
		fontWeight: typeScaleVars['--text-heading-4-weight']
	},
	5: {
		fontSize: typeScaleVars['--text-heading-5-size'],
		lineHeight: typeScaleVars['--text-heading-5-leading'],
		fontWeight: typeScaleVars['--text-heading-5-weight']
	},
	6: {
		fontSize: typeScaleVars['--text-heading-6-size'],
		lineHeight: typeScaleVars['--text-heading-6-leading'],
		fontWeight: typeScaleVars['--text-heading-6-weight']
	}
});

// =============================================================================
// Display, truncation, wrapping, decoration
// =============================================================================

export const displayStyles = stylex.create({
	inline: { display: 'inline' },
	block: { display: 'block' }
});

export const truncationStyles = stylex.create({
	singleLine: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		display: 'block'
	},
	// The `-webkit-line-clamp` count itself is a dynamic value and is written as
	// an inline declaration by the component.
	multiLine: {
		overflow: 'hidden',
		display: '-webkit-box',
		WebkitBoxOrient: 'vertical'
	}
});

/**
 * The surface a truncation tooltip's full text renders on. It repeats the
 * tooltip's own content constraints because the tooltip is handed a node, not a
 * string, and that node is what has to wrap.
 */
export const truncationTooltipStyles = stylex.create({
	content: {
		maxWidth: '300px',
		wordBreak: 'break-word'
	}
});

/** Classes for a truncation tooltip's content wrapper. */
export function truncationTooltipContentAttrs(): SvelteStyleAttrs {
	return sx(truncationTooltipStyles.content);
}

export const wordBreakStyles = stylex.create({
	'break-word': { wordBreak: 'normal', overflowWrap: 'break-word' },
	'break-all': { wordBreak: 'break-all' }
});

export const textWrapStyles = stylex.create({
	wrap: { textWrap: 'wrap' },
	nowrap: { textWrap: 'nowrap' },
	balance: { textWrap: 'balance' },
	pretty: { textWrap: 'pretty' }
});

export const capsizeStyles = stylex.create({
	enabled: {
		textBoxEdge: 'cap alphabetic',
		textBoxTrim: 'trim-both',
		display: 'block'
	}
});

export const decorationStyles = stylex.create({
	strikethrough: { textDecoration: 'line-through' }
});

export const tabularNumbersStyle = stylex.create({
	enabled: { fontVariantNumeric: 'tabular-nums' }
});

export const justifyStyles = stylex.create({
	start: { textAlign: 'start' },
	center: { textAlign: 'center' },
	end: { textAlign: 'end' }
});

// =============================================================================
// Composition
// =============================================================================

/** Colour applied when the consumer passes none. Custom types fall back to primary. */
const defaultColorByType: Record<string, TextColor> = {
	body: 'primary',
	large: 'primary',
	label: 'primary',
	supporting: 'secondary',
	code: 'primary',
	'display-1': 'primary',
	'display-2': 'primary',
	'display-3': 'primary',
	inherit: 'inherit'
};

export function resolveTextColor(type: TextType, color?: TextColor): TextColor {
	return color ?? defaultColorByType[type] ?? 'primary';
}

/**
 * Map a text type onto a StyleX style key. Theme-defined custom types have no
 * baseline of their own, so they render on `body` and pick up their look from
 * the theme's CSS overrides.
 */
export function resolveStyleType(type: TextType): BuiltinTextType {
	return type in sizeByTypeStyles ? (type as BuiltinTextType) : 'body';
}

/**
 * Map a text colour onto a StyleX style key. A theme-defined custom colour has
 * no baseline of its own, so it renders on `primary` and takes its actual colour
 * from the theme's CSS (`.astryx-text.<color>` / `.astryx-heading.<color>`) —
 * the class `themeProps` already emits from the unresolved value.
 *
 * The `in` guard is the runtime half of the `TextColorMap` seam: inside core the
 * two types coincide, so no cast is needed, but a consumer that augmented the
 * map can hand us a key `colorStyles` has never heard of.
 *
 * Shared with `Heading`, which applies the same fallback.
 */
export function resolveStyleColor(color: TextColor): BuiltinTextColor {
	return color in colorStyles ? (color as BuiltinTextColor) : 'primary';
}

/**
 * The clamp count is per-instance, so it is an inline declaration rather than an
 * atomic class — one class per possible line count would be unbounded. Returns
 * undefined below two lines, where `truncationStyles.singleLine` handles it.
 */
export function lineClampStyle(maxLines: number): string | undefined {
	return maxLines > 1 ? `-webkit-line-clamp:${maxLines}` : undefined;
}

export interface TextStyleInput {
	styleType: BuiltinTextType;
	color: TextColor;
	size?: TextSize;
	weight?: TextWeight;
	display: TextDisplay;
	maxLines: number;
	wordBreak: WordBreak;
	textWrap?: TextWrap;
	justify: TextJustify;
	hasCapsize: boolean;
	hasStrikethrough: boolean;
	hasTabularNumbers: boolean;
}

export function textAttrs(input: TextStyleInput, xstyle?: StyleArg): SvelteStyleAttrs {
	const { styleType, color, size, weight, display, maxLines, justify } = input;

	return sx(
		colorStyles[resolveStyleColor(color)],
		sizeByTypeStyles[styleType],
		size && sizeStyles[size],
		defaultWeightByTypeStyles[styleType],
		weight && weightStyles[weight],
		maxLines === 1
			? truncationStyles.singleLine
			: maxLines > 1
				? truncationStyles.multiLine
				: displayStyles[display],
		maxLines > 0 && wordBreakStyles[input.wordBreak],
		input.textWrap && textWrapStyles[input.textWrap],
		justify !== 'start' && justifyStyles[justify],
		input.hasCapsize && capsizeStyles.enabled,
		input.hasStrikethrough && decorationStyles.strikethrough,
		input.hasTabularNumbers && tabularNumbersStyle.enabled,
		xstyle
	);
}
