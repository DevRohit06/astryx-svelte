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
	wordBreakStyles,
	type TextColor,
	type TextDisplay,
	type TextJustify,
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
 * Display-scale sizing applied on top of a heading. Larger and lighter than the
 * level's own styling, while `level` still decides the element.
 */
export type HeadingType = 'display-1' | 'display-2' | 'display-3';

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
	const { level, type, color, display, maxLines, justify } = input;

	return sx(
		// Custom theme colours fall back to the `primary` baseline, the same
		// resolution `Text` applies — see `resolveStyleColor`.
		colorStyles[resolveStyleColor(color)],
		type ? sizeByTypeStyles[type] : sizeByLevelStyles[level],
		type && defaultWeightByTypeStyles[type],
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
