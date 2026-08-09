import * as stylex from '@stylexjs/stylex';
import { paddingBlockStyles, paddingInlineStyles } from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SpacingStep } from '../../internal/types.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

const alignItemsStyles = stylex.create({
	center: {
		alignItems: 'center'
	},
	end: {
		alignItems: 'flex-end'
	},
	start: {
		alignItems: 'flex-start'
	},
	stretch: {
		alignItems: 'stretch'
	}
});

/**
 * Cross-axis alignment — vertical for a horizontal stack, horizontal for a
 * vertical one.
 */
export type StackCrossAlignment = keyof typeof alignItemsStyles;

const justifyContentStyles = stylex.create({
	start: {
		justifyContent: 'flex-start'
	},
	center: {
		justifyContent: 'center'
	},
	end: {
		justifyContent: 'flex-end'
	},
	between: {
		justifyContent: 'space-between'
	},
	around: {
		justifyContent: 'space-around'
	},
	evenly: {
		justifyContent: 'space-evenly'
	}
});

/**
 * Main-axis alignment — horizontal for a horizontal stack, vertical for a
 * vertical one.
 */
export type StackMainAlignment = keyof typeof justifyContentStyles;

const directionStyles = stylex.create({
	horizontal: {
		flexDirection: 'row'
	},
	vertical: {
		flexDirection: 'column'
	}
});

/** `horizontal` flows items left-to-right; `vertical` top-to-bottom. */
export type StackDirection = keyof typeof directionStyles;

const wrapStyles = stylex.create({
	nowrap: {
		flexWrap: 'nowrap'
	},
	wrap: {
		flexWrap: 'wrap'
	},
	'wrap-reverse': {
		flexWrap: 'wrap-reverse'
	}
});

/** Flex wrapping behaviour. */
export type StackWrap = keyof typeof wrapStyles;

const baseStyles = stylex.create({
	stack: {
		display: 'flex'
	}
});

const gapStyles = stylex.create({
	0: {
		columnGap: spacingVars['--spacing-0'],
		rowGap: spacingVars['--spacing-0']
	},
	0.5: {
		columnGap: spacingVars['--spacing-0-5'],
		rowGap: spacingVars['--spacing-0-5']
	},
	1: {
		columnGap: spacingVars['--spacing-1'],
		rowGap: spacingVars['--spacing-1']
	},
	1.5: {
		columnGap: spacingVars['--spacing-1-5'],
		rowGap: spacingVars['--spacing-1-5']
	},
	2: {
		columnGap: spacingVars['--spacing-2'],
		rowGap: spacingVars['--spacing-2']
	},
	3: {
		columnGap: spacingVars['--spacing-3'],
		rowGap: spacingVars['--spacing-3']
	},
	4: {
		columnGap: spacingVars['--spacing-4'],
		rowGap: spacingVars['--spacing-4']
	},
	5: {
		columnGap: spacingVars['--spacing-5'],
		rowGap: spacingVars['--spacing-5']
	},
	6: {
		columnGap: spacingVars['--spacing-6'],
		rowGap: spacingVars['--spacing-6']
	},
	8: {
		columnGap: spacingVars['--spacing-8'],
		rowGap: spacingVars['--spacing-8']
	},
	10: {
		columnGap: spacingVars['--spacing-10'],
		rowGap: spacingVars['--spacing-10']
	}
});

const overflowStyles = stylex.create({
	scrollable: {
		overflow: 'auto'
	}
});

export interface StackOptions {
	/** Cross-axis position of the items. */
	crossAlign?: StackCrossAlignment;
	direction: StackDirection;
	gap?: SpacingStep;
	/** Main-axis position of the items. */
	mainAlign?: StackMainAlignment;
	/** @default 'nowrap' */
	wrap?: StackWrap;
}

/**
 * The flex-container styles for a stack, as a list to spread into `sx()`.
 *
 * Upstream's `stack()` verbatim — a component that wants stack layout on its own
 * root rather than a `<Stack>` wrapper spreads this alongside its own styles, so
 * the whole set goes through one `stylex.props` merge. `Layout` is the first
 * consumer here, and it is why the list form exists next to `stackAttrs`: a
 * finished class string cannot take part in that merge.
 */
export function stack({ crossAlign, direction, gap, mainAlign, wrap }: StackOptions) {
	return [
		baseStyles.stack,
		directionStyles[direction],
		gap != null && gapStyles[gap],
		crossAlign != null && alignItemsStyles[crossAlign],
		mainAlign != null && justifyContentStyles[mainAlign],
		wrap != null && wrapStyles[wrap]
	] as const;
}

export interface StackAttrsOptions extends StackOptions {
	paddingInline?: SpacingStep;
	paddingBlock?: SpacingStep;
	isScrollable?: boolean;
}

/**
 * The finished `class`/`style` pair for a `<Stack>`.
 *
 * `stack()` covers the flex container; the padding and overflow below are the
 * part upstream keeps in `Stack.tsx` rather than in the utility.
 */
export function stackAttrs(
	{
		direction,
		crossAlign,
		mainAlign,
		gap,
		wrap,
		paddingInline,
		paddingBlock,
		isScrollable
	}: StackAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		...stack({ direction, crossAlign, mainAlign, gap, wrap }),
		paddingInline != null && paddingInlineStyles[paddingInline],
		paddingBlock != null && paddingBlockStyles[paddingBlock],
		isScrollable && overflowStyles.scrollable,
		xstyle
	);
}
