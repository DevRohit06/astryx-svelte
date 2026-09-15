import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	capsizeStyles,
	colorStyles,
	decorationStyles,
	defaultWeightByTypeStyles,
	displayStyles,
	justifyStyles,
	sizeByLevelStyles,
	resolveStyleColor,
	sizeByTypeStyles,
	textWrapStyles,
	truncationStyles,
	weightStyles,
	wordBreakStyles,
	type TextColor,
	type TextDisplay,
	type TextJustify,
	type TextWeight,
	type TextWrap,
	type WordBreak
} from '../text/text.stylex.js';

/**
 * Heading composition. The style groups themselves live in `text.stylex.ts`, as
 * they do upstream, so Text and Heading cannot drift apart.
 */

/** Heading level, which fixes both the element (`h1`–`h6`) and the default look. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Extensible visual-type map for Heading, ported from upstream's
 * `Heading/index.ts`. A theme build adds custom visual roles by augmenting it:
 *
 * ```ts
 * declare module '@astryx-svelte/core' {
 * 	interface HeadingTypeMap {
 * 		hero: true;
 * 	}
 * }
 * ```
 *
 * Upstream added this at 0.5.3 so a theme can name a Heading role of its own
 * (#6026). The three built-ins keep their meaning; a custom name resolves to no
 * built-in style group, so the level's own sizing is the safe fallback — see
 * `isBuiltinHeadingType`.
 */
export interface HeadingTypeMap {
	'display-1': true;
	'display-2': true;
	'display-3': true;
}

/**
 * Display-scale sizing applied on top of a heading. Larger and lighter than the
 * level's own styling, while `level` still decides the element.
 */
export type HeadingType = keyof HeadingTypeMap;

/** The three roles this package ships styles for. */
export type BuiltinHeadingType = 'display-1' | 'display-2' | 'display-3';

const BUILTIN_HEADING_TYPES = new Set<string>(['display-1', 'display-2', 'display-3']);

/**
 * Whether `type` is one this package styles. A theme-registered role is a legal
 * `HeadingType` with no style group here, and indexing `sizeByTypeStyles` with
 * it would yield `undefined` — so the guard picks the level fallback instead.
 */
export function isBuiltinHeadingType(type: HeadingType): type is BuiltinHeadingType {
	return BUILTIN_HEADING_TYPES.has(type);
}

export const LEVEL_TO_TAG = {
	1: 'h1',
	2: 'h2',
	3: 'h3',
	4: 'h4',
	5: 'h5',
	6: 'h6'
} as const satisfies Record<HeadingLevel, string>;

export interface HeadingStyleInput {
	level: HeadingLevel;
	type?: HeadingType;
	/** Explicit font-weight override, applied after the type/level default. */
	weight?: TextWeight;
	color: TextColor;
	display: TextDisplay;
	maxLines: number;
	wordBreak: WordBreak;
	textWrap?: TextWrap;
	justify: TextJustify;
	hasCapsize: boolean;
	hasStrikethrough: boolean;
}

export function headingAttrs(input: HeadingStyleInput, xstyle?: StyleArg): SvelteStyleAttrs {
	const { level, type, color, display, maxLines, justify, weight } = input;
	// A theme-registered role has no style group here, so it falls back to the
	// level's sizing rather than indexing the map with a key it does not hold.
	const builtinType = type && isBuiltinHeadingType(type) ? type : undefined;

	return sx(
		// Custom theme colours fall back to the `primary` baseline, the same
		// resolution `Text` applies — see `resolveStyleColor`.
		colorStyles[resolveStyleColor(color)],
		builtinType ? sizeByTypeStyles[builtinType] : sizeByLevelStyles[level],
		builtinType && defaultWeightByTypeStyles[builtinType],
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
		xstyle
	);
}
