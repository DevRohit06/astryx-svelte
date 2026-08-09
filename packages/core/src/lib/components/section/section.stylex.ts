import * as stylex from '@stylexjs/stylex';
import { container, type SpacingToken } from '../../internal/container.stylex.js';
import {
	containerPaddingBlockEndVarStyles,
	containerPaddingBlockStartVarStyles,
	containerPaddingInlineVarStyles,
	paddingBlockStyles,
	paddingStyles,
	sectionPaddingPropagationStyles,
	spacingStepToToken
} from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SizeValue, SpacingStep } from '../../internal/types.js';
import { colorVars } from '../../styles/tokens.stylex.js';

/**
 * Extensible variant map for `Section`.
 *
 * Theme packages add custom variants via TypeScript module augmentation, exactly
 * as upstream does:
 *
 * ```ts
 * declare module '@astryx-svelte/core' {
 *   interface SectionVariantMap {
 *     elevated: true;
 *   }
 * }
 * ```
 */
export interface SectionVariantMap {
	section: true;
	transparent: true;
	muted: true;
}

/**
 * Visual variant for the section. Extensible via module augmentation of
 * `SectionVariantMap`.
 */
export type SectionVariant = keyof SectionVariantMap;

/** Which sides carry a divider border. */
export type SectionDivider = 'top' | 'bottom' | 'start' | 'end';

const variantStyles = stylex.create({
	section: {
		backgroundColor: colorVars['--color-background-surface']
	},
	transparent: {
		backgroundColor: 'transparent'
	},
	muted: {
		backgroundColor: colorVars['--color-background-muted']
	}
});

// Escaping the parent container's padding when nested.
const nestedStyles = stylex.create({
	// The outer wrapper cancels the parent's container padding so a Section can
	// bleed edge-to-edge.
	outer: {
		marginInlineStart: 'calc(-1 * var(--container-padding-inline-start, 0px))',
		marginInlineEnd: 'calc(-1 * var(--container-padding-inline-end, 0px))',
		marginTop: {
			default: null,
			':first-child': 'calc(-1 * var(--container-padding-block-start, 0px))'
		},
		marginBottom: {
			default: null,
			':last-child': 'calc(-1 * var(--container-padding-block-end, 0px))'
		}
	},
	// The inner wrapper zeroes the container padding for its own descendants.
	inner: {
		'--container-padding-inline-start': '0px',
		'--container-padding-inline-end': '0px',
		'--container-padding-block-start': '0px',
		'--container-padding-block-end': '0px',
		height: '100%'
	}
});

const dividerStyles = stylex.create({
	top: {
		borderTopWidth: 1,
		borderTopStyle: 'solid',
		borderTopColor: colorVars['--color-border']
	},
	bottom: {
		borderBottomWidth: 1,
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border']
	},
	start: {
		borderInlineStartWidth: 1,
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border']
	},
	end: {
		borderInlineEndWidth: 1,
		borderInlineEndStyle: 'solid',
		borderInlineEndColor: colorVars['--color-border']
	}
});

const dynamicStyles = stylex.create({
	sizing: (
		width: SizeValue | null,
		height: SizeValue | null,
		maxWidth: SizeValue | null,
		minHeight: SizeValue | null
	) => ({
		width,
		height,
		maxWidth,
		minHeight
	})
});

export interface SectionSizingOptions {
	width?: SizeValue;
	height?: SizeValue;
	maxWidth?: SizeValue;
	minHeight?: SizeValue;
}

/**
 * The outer wrapper: margin-negation to escape parent padding, the caller's
 * sizing props, and their `xstyle` override. Rest props and `class`/`style`
 * land here too (in the component), matching upstream's structure.
 */
export function sectionOuterAttrs(
	{ width, height, maxWidth, minHeight }: SectionSizingOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		nestedStyles.outer,
		dynamicStyles.sizing(width ?? null, height ?? null, maxWidth ?? null, minHeight ?? null),
		xstyle
	);
}

export interface SectionInnerOptions {
	variant: SectionVariant;
	padding?: SpacingStep;
	paddingBlock?: SpacingStep;
	dividers?: SectionDivider[];
}

/**
 * The inner styled region: container padding cascade, background variant and
 * dividers. The stable `astryx-section`/variant class is merged on top in the
 * component via `themeProps`.
 */
export function sectionInnerAttrs({
	variant,
	padding,
	paddingBlock,
	dividers
}: SectionInnerOptions): SvelteStyleAttrs {
	// No explicit padding → cascade from the theme's `--astryx-section-*` tokens.
	const useThemeDefault = padding == null;
	const effectivePadding = padding ?? 4;
	const paddingToken: SpacingToken = spacingStepToToken[effectivePadding];

	return sx(
		nestedStyles.inner,
		...container(
			useThemeDefault
				? { useThemeDefault: 'section' }
				: {
						paddingInnerX: paddingToken,
						paddingInnerY: paddingToken,
						paddingOuterX: paddingToken,
						paddingOuterY: paddingToken
					}
		),
		!useThemeDefault && effectivePadding !== 4 && paddingStyles[effectivePadding],
		!useThemeDefault && effectivePadding !== 4 && containerPaddingInlineVarStyles[effectivePadding],
		!useThemeDefault &&
			effectivePadding !== 4 &&
			containerPaddingBlockStartVarStyles[effectivePadding],
		!useThemeDefault &&
			effectivePadding !== 4 &&
			containerPaddingBlockEndVarStyles[effectivePadding],
		// No `!== 4` guard: even explicit `padding={4}` publishes the propagation
		// token so nested theme-default sections inherit it.
		!useThemeDefault && sectionPaddingPropagationStyles[effectivePadding],
		paddingBlock != null && paddingBlockStyles[paddingBlock],
		paddingBlock != null && containerPaddingBlockStartVarStyles[paddingBlock],
		paddingBlock != null && containerPaddingBlockEndVarStyles[paddingBlock],
		variantStyles[variant],
		dividers?.includes('top') && dividerStyles.top,
		dividers?.includes('bottom') && dividerStyles.bottom,
		dividers?.includes('start') && dividerStyles.start,
		dividers?.includes('end') && dividerStyles.end
	);
}
