import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '../styles/tokens.stylex.js';

/**
 * Layout container padding, ported from Astryx's `src/Layout/container.stylex.ts`.
 *
 * ## Public API for themes
 *
 * Themes set `padding` on a container component's override. The theme build
 * pipeline expands that to component-scoped custom properties, which the
 * component reads:
 *
 *   --astryx-card-padding             (shorthand — all sides)
 *   --astryx-card-padding-inline
 *   --astryx-card-padding-block-start
 *   --astryx-card-padding-block-end
 *
 * Read order per level is `var(--astryx-…, <next level>)`, terminating at
 * `--spacing-4`.
 *
 * The internal variables (`--layout-padding-inner-x`, `--container-padding-*`,
 * `--_section-padding-propagated`) are implementation details; themes must not
 * reference them. They also do not cross an overlay boundary — see
 * `overlayPaddingReset` in `padding.stylex.ts`.
 *
 * The `card`, `section` and `dialog` chains are ported.
 */

/** Spacing token keys accepted by the padding props. */
export type SpacingToken =
	| 'spacing0'
	| 'spacing0_5'
	| 'spacing1'
	| 'spacing1_5'
	| 'spacing2'
	| 'spacing3'
	| 'spacing4'
	| 'spacing5'
	| 'spacing6'
	| 'spacing7'
	| 'spacing8'
	| 'spacing9'
	| 'spacing10'
	| 'spacing11'
	| 'spacing12';

const baseStyles = stylex.create({
	container: {
		boxSizing: 'border-box',
		paddingInlineStart: 'var(--container-padding-inline-start)',
		paddingInlineEnd: 'var(--container-padding-inline-end)',
		paddingBlockStart: 'var(--container-padding-block-start)',
		paddingBlockEnd: 'var(--container-padding-block-end)'
	}
});

const SP4 = spacingVars['--spacing-4'];

// Card padding chain: the --astryx-* token, then the next level down,
// terminating at --spacing-4. Written as chained consts rather than a function
// so StyleX can analyse them statically.
//
// The indirection exists because StyleX's useCSSLayers emits priority-0 custom
// property assignments outside any @layer, which makes them impossible to
// override from `@layer astryx-theme`. Reading through a higher-level token
// means the theme sets the token and the component picks it up through the
// custom-property cascade — no layer competition.
const cardShorthand = `var(--astryx-card-padding, ${SP4})`;
const cardInline = `var(--astryx-card-padding-inline, ${cardShorthand})`;
const cardInlineStart = `var(--astryx-card-padding-inline-start, ${cardInline})`;
const cardInlineEnd = `var(--astryx-card-padding-inline-end, ${cardInline})`;
const cardBlockStart = `var(--astryx-card-padding-block-start, ${cardShorthand})`;
const cardBlockEnd = `var(--astryx-card-padding-block-end, ${cardShorthand})`;

// Section padding chain — identical shape to card's, keyed off `--astryx-section-*`.
// `--_section-padding-propagated` (set by an ancestor `Section` with explicit
// padding) is read AHEAD of the public theme token, so a propagated value still
// wins over the theme for nested sections. Splitting the two names is what lets
// an overlay drop the inherited value at its boundary while keeping the theme's
// — see `overlayPaddingReset` in `padding.stylex.ts`.
const sectionThemeShorthand = `var(--astryx-section-padding, ${SP4})`;
const sectionShorthand = `var(--_section-padding-propagated, ${sectionThemeShorthand})`;
const sectionInline = `var(--astryx-section-padding-inline, ${sectionShorthand})`;
const sectionInlineStart = `var(--astryx-section-padding-inline-start, ${sectionInline})`;
const sectionInlineEnd = `var(--astryx-section-padding-inline-end, ${sectionInline})`;
const sectionBlockStart = `var(--astryx-section-padding-block-start, ${sectionShorthand})`;
const sectionBlockEnd = `var(--astryx-section-padding-block-end, ${sectionShorthand})`;

// Dialog padding chain — identical shape to card's, keyed off `--astryx-dialog-*`.
const dialogShorthand = `var(--astryx-dialog-padding, ${SP4})`;
const dialogInline = `var(--astryx-dialog-padding-inline, ${dialogShorthand})`;
const dialogInlineStart = `var(--astryx-dialog-padding-inline-start, ${dialogInline})`;
const dialogInlineEnd = `var(--astryx-dialog-padding-inline-end, ${dialogInline})`;
const dialogBlockStart = `var(--astryx-dialog-padding-block-start, ${dialogShorthand})`;
const dialogBlockEnd = `var(--astryx-dialog-padding-block-end, ${dialogShorthand})`;

const cardDefaultPaddingStyles = stylex.create({
	containerPaddingInlineStart: {
		'--container-padding-inline-start': cardInlineStart
	},
	containerPaddingInlineEnd: {
		'--container-padding-inline-end': cardInlineEnd
	},
	containerPaddingBlockStart: {
		'--container-padding-block-start': cardBlockStart
	},
	containerPaddingBlockEnd: {
		'--container-padding-block-end': cardBlockEnd
	},
	layoutPaddingOuterX: {
		'--layout-padding-outer-x': cardInlineStart
	},
	layoutPaddingOuterY: {
		'--layout-padding-outer-y': cardBlockStart
	},
	layoutPaddingInnerX: {
		'--layout-padding-inner-x': cardInlineStart
	},
	layoutPaddingInnerY: {
		'--layout-padding-inner-y': cardBlockStart
	}
});

const sectionDefaultPaddingStyles = stylex.create({
	containerPaddingInlineStart: {
		'--container-padding-inline-start': sectionInlineStart
	},
	containerPaddingInlineEnd: {
		'--container-padding-inline-end': sectionInlineEnd
	},
	containerPaddingBlockStart: {
		'--container-padding-block-start': sectionBlockStart
	},
	containerPaddingBlockEnd: {
		'--container-padding-block-end': sectionBlockEnd
	},
	layoutPaddingOuterX: {
		'--layout-padding-outer-x': sectionInlineStart
	},
	layoutPaddingOuterY: {
		'--layout-padding-outer-y': sectionBlockStart
	},
	layoutPaddingInnerX: {
		'--layout-padding-inner-x': sectionInlineStart
	},
	layoutPaddingInnerY: {
		'--layout-padding-inner-y': sectionBlockStart
	}
});

const dialogDefaultPaddingStyles = stylex.create({
	containerPaddingInlineStart: {
		'--container-padding-inline-start': dialogInlineStart
	},
	containerPaddingInlineEnd: {
		'--container-padding-inline-end': dialogInlineEnd
	},
	containerPaddingBlockStart: {
		'--container-padding-block-start': dialogBlockStart
	},
	containerPaddingBlockEnd: {
		'--container-padding-block-end': dialogBlockEnd
	},
	layoutPaddingOuterX: {
		'--layout-padding-outer-x': dialogInlineStart
	},
	layoutPaddingOuterY: {
		'--layout-padding-outer-y': dialogBlockStart
	},
	layoutPaddingInnerX: {
		'--layout-padding-inner-x': dialogInlineStart
	},
	layoutPaddingInnerY: {
		'--layout-padding-inner-y': dialogBlockStart
	}
});

const themeDefaultStyles = {
	card: cardDefaultPaddingStyles,
	section: sectionDefaultPaddingStyles,
	dialog: dialogDefaultPaddingStyles
};

/** A container component whose padding a theme can override by name. */
export type ContainerComponent = keyof typeof themeDefaultStyles;

/**
 * Inline padding, published so edge-compensating children — bleed tables,
 * full-bleed dividers — know what to cancel.
 */
const containerPaddingInlineStartStyles = stylex.create({
	spacing0: { '--container-padding-inline-start': spacingVars['--spacing-0'] },
	spacing0_5: { '--container-padding-inline-start': spacingVars['--spacing-0-5'] },
	spacing1: { '--container-padding-inline-start': spacingVars['--spacing-1'] },
	spacing1_5: { '--container-padding-inline-start': spacingVars['--spacing-1-5'] },
	spacing2: { '--container-padding-inline-start': spacingVars['--spacing-2'] },
	spacing3: { '--container-padding-inline-start': spacingVars['--spacing-3'] },
	spacing4: { '--container-padding-inline-start': spacingVars['--spacing-4'] },
	spacing5: { '--container-padding-inline-start': spacingVars['--spacing-5'] },
	spacing6: { '--container-padding-inline-start': spacingVars['--spacing-6'] },
	spacing7: { '--container-padding-inline-start': spacingVars['--spacing-7'] },
	spacing8: { '--container-padding-inline-start': spacingVars['--spacing-8'] },
	spacing9: { '--container-padding-inline-start': spacingVars['--spacing-9'] },
	spacing10: { '--container-padding-inline-start': spacingVars['--spacing-10'] },
	spacing11: { '--container-padding-inline-start': spacingVars['--spacing-11'] },
	spacing12: { '--container-padding-inline-start': spacingVars['--spacing-12'] }
});

const containerPaddingInlineEndStyles = stylex.create({
	spacing0: { '--container-padding-inline-end': spacingVars['--spacing-0'] },
	spacing0_5: { '--container-padding-inline-end': spacingVars['--spacing-0-5'] },
	spacing1: { '--container-padding-inline-end': spacingVars['--spacing-1'] },
	spacing1_5: { '--container-padding-inline-end': spacingVars['--spacing-1-5'] },
	spacing2: { '--container-padding-inline-end': spacingVars['--spacing-2'] },
	spacing3: { '--container-padding-inline-end': spacingVars['--spacing-3'] },
	spacing4: { '--container-padding-inline-end': spacingVars['--spacing-4'] },
	spacing5: { '--container-padding-inline-end': spacingVars['--spacing-5'] },
	spacing6: { '--container-padding-inline-end': spacingVars['--spacing-6'] },
	spacing7: { '--container-padding-inline-end': spacingVars['--spacing-7'] },
	spacing8: { '--container-padding-inline-end': spacingVars['--spacing-8'] },
	spacing9: { '--container-padding-inline-end': spacingVars['--spacing-9'] },
	spacing10: { '--container-padding-inline-end': spacingVars['--spacing-10'] },
	spacing11: { '--container-padding-inline-end': spacingVars['--spacing-11'] },
	spacing12: { '--container-padding-inline-end': spacingVars['--spacing-12'] }
});

/**
 * Block padding, split start from end because Layout areas are asymmetric —
 * a header's block-start is the outer padding and its block-end the inner one.
 */
const containerPaddingBlockStartStyles = stylex.create({
	spacing0: { '--container-padding-block-start': spacingVars['--spacing-0'] },
	spacing0_5: { '--container-padding-block-start': spacingVars['--spacing-0-5'] },
	spacing1: { '--container-padding-block-start': spacingVars['--spacing-1'] },
	spacing1_5: { '--container-padding-block-start': spacingVars['--spacing-1-5'] },
	spacing2: { '--container-padding-block-start': spacingVars['--spacing-2'] },
	spacing3: { '--container-padding-block-start': spacingVars['--spacing-3'] },
	spacing4: { '--container-padding-block-start': spacingVars['--spacing-4'] },
	spacing5: { '--container-padding-block-start': spacingVars['--spacing-5'] },
	spacing6: { '--container-padding-block-start': spacingVars['--spacing-6'] },
	spacing7: { '--container-padding-block-start': spacingVars['--spacing-7'] },
	spacing8: { '--container-padding-block-start': spacingVars['--spacing-8'] },
	spacing9: { '--container-padding-block-start': spacingVars['--spacing-9'] },
	spacing10: { '--container-padding-block-start': spacingVars['--spacing-10'] },
	spacing11: { '--container-padding-block-start': spacingVars['--spacing-11'] },
	spacing12: { '--container-padding-block-start': spacingVars['--spacing-12'] }
});

const containerPaddingBlockEndStyles = stylex.create({
	spacing0: { '--container-padding-block-end': spacingVars['--spacing-0'] },
	spacing0_5: { '--container-padding-block-end': spacingVars['--spacing-0-5'] },
	spacing1: { '--container-padding-block-end': spacingVars['--spacing-1'] },
	spacing1_5: { '--container-padding-block-end': spacingVars['--spacing-1-5'] },
	spacing2: { '--container-padding-block-end': spacingVars['--spacing-2'] },
	spacing3: { '--container-padding-block-end': spacingVars['--spacing-3'] },
	spacing4: { '--container-padding-block-end': spacingVars['--spacing-4'] },
	spacing5: { '--container-padding-block-end': spacingVars['--spacing-5'] },
	spacing6: { '--container-padding-block-end': spacingVars['--spacing-6'] },
	spacing7: { '--container-padding-block-end': spacingVars['--spacing-7'] },
	spacing8: { '--container-padding-block-end': spacingVars['--spacing-8'] },
	spacing9: { '--container-padding-block-end': spacingVars['--spacing-9'] },
	spacing10: { '--container-padding-block-end': spacingVars['--spacing-10'] },
	spacing11: { '--container-padding-block-end': spacingVars['--spacing-11'] },
	spacing12: { '--container-padding-block-end': spacingVars['--spacing-12'] }
});

const paddingOuterXStyles = stylex.create({
	spacing0: { '--layout-padding-outer-x': spacingVars['--spacing-0'] },
	spacing0_5: { '--layout-padding-outer-x': spacingVars['--spacing-0-5'] },
	spacing1: { '--layout-padding-outer-x': spacingVars['--spacing-1'] },
	spacing1_5: { '--layout-padding-outer-x': spacingVars['--spacing-1-5'] },
	spacing2: { '--layout-padding-outer-x': spacingVars['--spacing-2'] },
	spacing3: { '--layout-padding-outer-x': spacingVars['--spacing-3'] },
	spacing4: { '--layout-padding-outer-x': spacingVars['--spacing-4'] },
	spacing5: { '--layout-padding-outer-x': spacingVars['--spacing-5'] },
	spacing6: { '--layout-padding-outer-x': spacingVars['--spacing-6'] },
	spacing7: { '--layout-padding-outer-x': spacingVars['--spacing-7'] },
	spacing8: { '--layout-padding-outer-x': spacingVars['--spacing-8'] },
	spacing9: { '--layout-padding-outer-x': spacingVars['--spacing-9'] },
	spacing10: { '--layout-padding-outer-x': spacingVars['--spacing-10'] },
	spacing11: { '--layout-padding-outer-x': spacingVars['--spacing-11'] },
	spacing12: { '--layout-padding-outer-x': spacingVars['--spacing-12'] }
});

const paddingOuterYStyles = stylex.create({
	spacing0: { '--layout-padding-outer-y': spacingVars['--spacing-0'] },
	spacing0_5: { '--layout-padding-outer-y': spacingVars['--spacing-0-5'] },
	spacing1: { '--layout-padding-outer-y': spacingVars['--spacing-1'] },
	spacing1_5: { '--layout-padding-outer-y': spacingVars['--spacing-1-5'] },
	spacing2: { '--layout-padding-outer-y': spacingVars['--spacing-2'] },
	spacing3: { '--layout-padding-outer-y': spacingVars['--spacing-3'] },
	spacing4: { '--layout-padding-outer-y': spacingVars['--spacing-4'] },
	spacing5: { '--layout-padding-outer-y': spacingVars['--spacing-5'] },
	spacing6: { '--layout-padding-outer-y': spacingVars['--spacing-6'] },
	spacing7: { '--layout-padding-outer-y': spacingVars['--spacing-7'] },
	spacing8: { '--layout-padding-outer-y': spacingVars['--spacing-8'] },
	spacing9: { '--layout-padding-outer-y': spacingVars['--spacing-9'] },
	spacing10: { '--layout-padding-outer-y': spacingVars['--spacing-10'] },
	spacing11: { '--layout-padding-outer-y': spacingVars['--spacing-11'] },
	spacing12: { '--layout-padding-outer-y': spacingVars['--spacing-12'] }
});

const paddingInnerXStyles = stylex.create({
	spacing0: { '--layout-padding-inner-x': spacingVars['--spacing-0'] },
	spacing0_5: { '--layout-padding-inner-x': spacingVars['--spacing-0-5'] },
	spacing1: { '--layout-padding-inner-x': spacingVars['--spacing-1'] },
	spacing1_5: { '--layout-padding-inner-x': spacingVars['--spacing-1-5'] },
	spacing2: { '--layout-padding-inner-x': spacingVars['--spacing-2'] },
	spacing3: { '--layout-padding-inner-x': spacingVars['--spacing-3'] },
	spacing4: { '--layout-padding-inner-x': spacingVars['--spacing-4'] },
	spacing5: { '--layout-padding-inner-x': spacingVars['--spacing-5'] },
	spacing6: { '--layout-padding-inner-x': spacingVars['--spacing-6'] },
	spacing7: { '--layout-padding-inner-x': spacingVars['--spacing-7'] },
	spacing8: { '--layout-padding-inner-x': spacingVars['--spacing-8'] },
	spacing9: { '--layout-padding-inner-x': spacingVars['--spacing-9'] },
	spacing10: { '--layout-padding-inner-x': spacingVars['--spacing-10'] },
	spacing11: { '--layout-padding-inner-x': spacingVars['--spacing-11'] },
	spacing12: { '--layout-padding-inner-x': spacingVars['--spacing-12'] }
});

const paddingInnerYStyles = stylex.create({
	spacing0: { '--layout-padding-inner-y': spacingVars['--spacing-0'] },
	spacing0_5: { '--layout-padding-inner-y': spacingVars['--spacing-0-5'] },
	spacing1: { '--layout-padding-inner-y': spacingVars['--spacing-1'] },
	spacing1_5: { '--layout-padding-inner-y': spacingVars['--spacing-1-5'] },
	spacing2: { '--layout-padding-inner-y': spacingVars['--spacing-2'] },
	spacing3: { '--layout-padding-inner-y': spacingVars['--spacing-3'] },
	spacing4: { '--layout-padding-inner-y': spacingVars['--spacing-4'] },
	spacing5: { '--layout-padding-inner-y': spacingVars['--spacing-5'] },
	spacing6: { '--layout-padding-inner-y': spacingVars['--spacing-6'] },
	spacing7: { '--layout-padding-inner-y': spacingVars['--spacing-7'] },
	spacing8: { '--layout-padding-inner-y': spacingVars['--spacing-8'] },
	spacing9: { '--layout-padding-inner-y': spacingVars['--spacing-9'] },
	spacing10: { '--layout-padding-inner-y': spacingVars['--spacing-10'] },
	spacing11: { '--layout-padding-inner-y': spacingVars['--spacing-11'] },
	spacing12: { '--layout-padding-inner-y': spacingVars['--spacing-12'] }
});

const maxHeightStyles = stylex.create({
	containerMaxHeight: (maxHeight: string) => ({
		'--container-max-height': maxHeight
	})
});

export interface ContainerOptions {
	/**
	 * Sets all four padding values at once. The individual props below override
	 * it on their own axis.
	 * @default 'spacing4'
	 */
	padding?: SpacingToken;
	/** Outer inline padding. Publishes `--container-padding-inline-*`. */
	paddingOuterX?: SpacingToken;
	/** Outer block padding. Publishes `--container-padding-block-*`. */
	paddingOuterY?: SpacingToken;
	/** Inner inline padding for content areas. */
	paddingInnerX?: SpacingToken;
	/** Inner block padding for content areas. */
	paddingInnerY?: SpacingToken;
	/**
	 * Cascade the internal padding variables from the named component's public
	 * `--astryx-*` tokens instead of from explicit spacing values, so a theme can
	 * set that component's padding without touching internals. Used by `Card`
	 * when no explicit `padding` prop is given.
	 */
	useThemeDefault?: ContainerComponent;
	/**
	 * Publishes `--container-max-height`, which Layout reads to contain scroll
	 * in fill mode. Any CSS length.
	 */
	maxHeight?: string;
}

/**
 * Container padding styles, for any element that hosts layout children.
 *
 * Returns an array so callers can spread it into `sx()`, the way upstream
 * spreads it into `stylex.props()`.
 */
export function container({
	padding = 'spacing4',
	paddingOuterX,
	paddingOuterY,
	paddingInnerX,
	paddingInnerY,
	useThemeDefault,
	maxHeight
}: ContainerOptions) {
	const outerX = paddingOuterX ?? padding;
	const outerY = paddingOuterY ?? padding;
	const innerX = paddingInnerX ?? padding;
	const innerY = paddingInnerY ?? padding;

	const maxHeightStyle = maxHeight ? maxHeightStyles.containerMaxHeight(maxHeight) : null;

	if (useThemeDefault) {
		const defaults = themeDefaultStyles[useThemeDefault];
		return [
			baseStyles.container,
			defaults.containerPaddingInlineStart,
			defaults.containerPaddingInlineEnd,
			defaults.containerPaddingBlockStart,
			defaults.containerPaddingBlockEnd,
			defaults.layoutPaddingOuterX,
			defaults.layoutPaddingOuterY,
			defaults.layoutPaddingInnerX,
			defaults.layoutPaddingInnerY,
			maxHeightStyle
		] as const;
	}

	return [
		baseStyles.container,
		containerPaddingInlineStartStyles[outerX],
		containerPaddingInlineEndStyles[outerX],
		containerPaddingBlockStartStyles[outerY],
		containerPaddingBlockEndStyles[outerY],
		paddingOuterXStyles[outerX],
		paddingOuterYStyles[outerY],
		paddingInnerXStyles[innerX],
		paddingInnerYStyles[innerY],
		maxHeightStyle
	] as const;
}
