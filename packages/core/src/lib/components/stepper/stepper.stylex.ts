import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import type { StepperIndicatorPosition, StepperOrientation } from './stepper-context.svelte.js';

/**
 * Ported from the `stylex.create` block in Astryx's `Stepper/Stepper.tsx`.
 *
 * The `<ol>` is a flex line whose direction follows `orientation`; the on-track
 * variants exist because those steps must abut so their connector segments form
 * one continuous line, which collapses the inter-step gap to zero.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		width: '100%',
		listStyleType: 'none',
		margin: 0,
		padding: 0
	},
	horizontal: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacingVars['--spacing-0-5']
	},
	vertical: {
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	},
	// On-track: steps must abut so their connector segments form one continuous
	// line, so the inter-step gap collapses to zero.
	horizontalOnTrack: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 0
	},
	verticalOnTrack: {
		flexDirection: 'column',
		gap: 0
	}
});

export interface StepperRootOptions {
	orientation: StepperOrientation;
	indicatorPosition: StepperIndicatorPosition;
}

/** The `<ol>` that holds the steps. */
export function stepperRootAttrs(
	{ orientation, indicatorPosition }: StepperRootOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const isOnTrack = indicatorPosition === 'on-track';
	const orientationStyle =
		orientation === 'horizontal'
			? isOnTrack
				? styles.horizontalOnTrack
				: styles.horizontal
			: isOnTrack
				? styles.verticalOnTrack
				: styles.vertical;

	return sx(styles.root, orientationStyle, xstyle);
}
