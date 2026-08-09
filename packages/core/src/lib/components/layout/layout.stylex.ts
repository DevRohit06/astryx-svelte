import * as stylex from '@stylexjs/stylex';
import {
	layoutPaddingOuterXVarStyles,
	layoutPaddingOuterYVarStyles
} from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SizeValue, SpacingStep } from '../../internal/types.js';
import { stack } from '../stack/stack.stylex.js';
import { stackItem } from '../stack/stack-item.stylex.js';

/**
 * The four elements `Layout` renders, ported from Astryx's `Layout.tsx`.
 *
 * The outer/inner pair is the padding-escape trick: the outer wrapper cancels
 * the enclosing container's padding with negative margins, and the inner one
 * zeroes the container variables so descendants do not inherit padding that has
 * already been escaped.
 */

const styles = stylex.create({
	// Outer wrapper uses negative margin to escape container padding
	layoutOuter: {
		marginInlineStart: 'calc(-1 * var(--container-padding-inline-start, 0px))',
		marginInlineEnd: 'calc(-1 * var(--container-padding-inline-end, 0px))',
		marginBlockStart: 'calc(-1 * var(--container-padding-block-start, 0px))',
		marginBlockEnd: 'calc(-1 * var(--container-padding-block-end, 0px))'
	},
	// Inner wrapper resets container padding vars for descendants
	layoutInner: {
		'--container-padding-inline-start': '0px',
		'--container-padding-inline-end': '0px',
		'--container-padding-block-start': '0px',
		'--container-padding-block-end': '0px'
	},
	fill: {
		// Add 2x container block padding to compensate for negative block margins
		height:
			'calc(100% + var(--container-padding-block-start, 0px) + var(--container-padding-block-end, 0px))',
		maxHeight: 'var(--container-max-height, none)'
	},
	auto: {
		minHeight: '100%'
	},
	middle: {
		flex: 1,
		minHeight: 0
	},
	// When full bleed, set outer padding variables to 0 so child components touch container edges
	fullBleed: {
		'--layout-padding-outer-x': '0px',
		'--layout-padding-outer-y': '0px'
	}
});

const dynamicStyles = stylex.create({
	contentWidthVar: (width: SizeValue) => ({
		'--layout-content-width': typeof width === 'number' ? `${width}px` : width
	}),
	contentWidth: (width: SizeValue) => ({
		width: '100%',
		maxWidth: typeof width === 'number' ? `${width}px` : width,
		marginInline: 'auto'
	})
});

/** The root element: escapes the container's padding, and takes its height mode. */
export function layoutOuterAttrs(isFill: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.layoutOuter, isFill ? styles.fill : styles.auto, xstyle);
}

export interface LayoutInnerOptions {
	isFill: boolean;
	padding?: SpacingStep;
	contentWidth?: SizeValue;
}

/**
 * The vertical stack holding header, middle row and footer.
 *
 * It carries `stylex.defaultMarker()`, which is what `LayoutContent`'s
 * `when.ancestor` rules resolve against — the padding collapse it applies when
 * an adjacent header or footer has no divider is a `:has(> …)` on *this*
 * element, so the marker and the slots have to be parent and direct child.
 */
export function layoutInnerAttrs({
	isFill,
	padding,
	contentWidth
}: LayoutInnerOptions): SvelteStyleAttrs {
	return sx(
		stylex.defaultMarker(),
		styles.layoutInner,
		...stack({ direction: 'vertical' }),
		isFill ? styles.fill : styles.auto,
		padding === 0 && styles.fullBleed,
		padding != null && layoutPaddingOuterXVarStyles[padding],
		padding != null && layoutPaddingOuterYVarStyles[padding],
		contentWidth != null && dynamicStyles.contentWidthVar(contentWidth)
	);
}

/** The horizontal row: start panel, content, end panel. */
export function layoutMiddleAttrs(contentWidth?: SizeValue): SvelteStyleAttrs {
	return sx(
		...stack({ direction: 'horizontal' }),
		styles.middle,
		contentWidth != null && dynamicStyles.contentWidth(contentWidth)
	);
}

/** The flex item between the two panels, which the content slot fills. */
export function layoutContentSlotAttrs(): SvelteStyleAttrs {
	return sx(...stackItem({ size: 'fill' }));
}
