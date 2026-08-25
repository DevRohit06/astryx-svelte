import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	shadowVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import type { SegmentedControlSize } from './segmented-control-context.svelte.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

const styles = stylex.create({
	base: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-3'],
		backgroundColor: 'transparent',
		borderWidth: 0,
		borderStyle: 'none',
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		whiteSpace: 'nowrap',
		transitionProperty: 'color, background-color, box-shadow',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	hover: {
		backgroundColor: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		}
	},
	selected: {
		// Forced colors (Windows High Contrast) strips the painted surface fill
		// and box shadow, which would leave the selected segment with no state
		// indication beyond font weight. Highlight/HighlightText is the platform
		// convention for a selected item (WCAG 1.4.11).
		//
		// forced-color-adjust must be `none` here: the segment is a <button>, and
		// the UA keeps native form-control colors (ButtonFace surface) for it under
		// forced colors, ignoring the authored Highlight fill — the label kept its
		// HighlightText color, giving white text on a white surface. Opting the
		// selected segment out of UA remapping makes both the Highlight surface and
		// the HighlightText label render as authored, restoring figure-ground.
		forcedColorAdjust: 'none',
		color: {
			default: colorVars['--color-text-primary'],
			'@media (forced-colors: active)': 'HighlightText'
		},
		fontWeight: fontWeightVars['--font-weight-semibold'],
		backgroundColor: {
			default: colorVars['--color-background-surface'],
			'@media (forced-colors: active)': 'Highlight'
		},
		boxShadow: shadowVars['--shadow-low']
	},
	disabled: {
		cursor: 'default',
		color: colorVars['--color-text-disabled']
	},
	fill: {
		flex: 1,
		minWidth: 0,
		justifyContent: 'center'
	},
	icon: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0
	},
	labelText: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		minWidth: 0
	}
});

// The segment radius is concentric with the container's: the container radius
// minus its padding, floored at 0.
const CONCENTRIC_RADIUS =
	'max(0px, calc(var(--_segmented-control-radius) - var(--_segmented-control-padding)))';

const sizeStyles = stylex.create({
	sm: {
		height: `calc(${sizeVars['--size-element-sm']} - 4px)`,
		borderRadius: CONCENTRIC_RADIUS,
		paddingInline: spacingVars['--spacing-2'],
		fontSize: typeScaleVars['--text-supporting-size']
	},
	md: {
		height: `calc(${sizeVars['--size-element-md']} - 4px)`,
		borderRadius: CONCENTRIC_RADIUS,
		paddingInline: spacingVars['--spacing-3']
	},
	lg: {
		height: `calc(${sizeVars['--size-element-lg']} - 4px)`,
		borderRadius: CONCENTRIC_RADIUS,
		paddingInline: spacingVars['--spacing-3']
	}
});

const iconSizeStyles = stylex.create({
	sm: { width: '14px', height: '14px' },
	md: { width: '16px', height: '16px' },
	lg: { width: '18px', height: '18px' }
});

export interface SegmentedControlItemOptions {
	size: SegmentedControlSize;
	isSelected: boolean;
	isItemDisabled: boolean;
	isFill: boolean;
}

/** The radio-button segment styles. */
export function segmentedControlItemAttrs({
	size,
	isSelected,
	isItemDisabled,
	isFill
}: SegmentedControlItemOptions): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.base,
		sizeStyles[size],
		isFill && styles.fill,
		isSelected && styles.selected,
		!isSelected && !isItemDisabled && styles.hover,
		isItemDisabled && styles.disabled
	);
}

/** The label span, which ellipsizes rather than pushing the segment wider. */
export function segmentedControlLabelTextAttrs(): SvelteStyleAttrs {
	return sx(styles.labelText);
}

/** The leading icon slot. */
export function segmentedControlIconAttrs(size: SegmentedControlSize): SvelteStyleAttrs {
	return sx(styles.icon, iconSizeStyles[size]);
}
