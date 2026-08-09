import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, radiusVars, spacingVars } from '../../styles/tokens.stylex.js';
import type {
	SegmentedControlLayout,
	SegmentedControlSize
} from './segmented-control-context.svelte.js';

const styles = stylex.create({
	container: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-0-5'],
		'--_segmented-control-padding': spacingVars['--spacing-0-5'],
		padding: 'var(--_segmented-control-padding)',
		backgroundColor: colorVars['--color-neutral']
	},
	fill: {
		display: 'flex',
		width: '100%'
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none'
	},
	// Disabled *with* a disabledMessage: keep the dimmed look but leave pointer
	// events on so the group can receive hover and surface the reason tooltip.
	disabledWithMessage: {
		opacity: 0.5
	}
});

const sizeStyles = stylex.create({
	sm: {
		'--_segmented-control-radius': radiusVars['--radius-element'],
		borderRadius: 'var(--_segmented-control-radius)'
	},
	md: {
		'--_segmented-control-radius': radiusVars['--radius-element'],
		borderRadius: 'var(--_segmented-control-radius)'
	},
	lg: {
		'--_segmented-control-radius': radiusVars['--radius-element'],
		borderRadius: 'var(--_segmented-control-radius)'
	}
});

export interface SegmentedControlContainerOptions {
	size: SegmentedControlSize;
	layout: SegmentedControlLayout;
	isDisabled: boolean;
	showsDisabledMessage: boolean;
}

/** The radiogroup container styles. `xstyle` is threaded last. */
export function segmentedControlContainerAttrs(
	{ size, layout, isDisabled, showsDisabledMessage }: SegmentedControlContainerOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.container,
		sizeStyles[size],
		layout === 'fill' && styles.fill,
		isDisabled && (showsDisabledMessage ? styles.disabledWithMessage : styles.disabled),
		xstyle
	);
}
