import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';
import type { IndicatorSize } from './types.js';

/** The check glyph matches the control sizes the indicator families share. */
export const iconSizeForIndicator = {
	sm: 'sm',
	md: 'sm'
} as const;

const styles = stylex.create({
	// The children slot stands where the glyph would, so swapping a Spinner in
	// for the mark does not move the row. 1rem is Icon's `sm` box, which is what
	// `iconSizeForIndicator` resolves to at both indicator sizes.
	slot: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		width: '1rem',
		height: '1rem'
	},
	// Foreground for an inherit-shade Spinner, matching what the glyph would
	// have painted. The sibling indicators set `color` on their chrome for the
	// same reason.
	enabled: { color: colorVars['--color-accent'] },
	// The same token Icon's `color="disabled"` resolves to, so the busy and the
	// glyph paths read identically when the owner is disabled.
	disabled: { color: colorVars['--color-icon-disabled'] }
});

/** The children slot — the box the glyph would have occupied. */
export function checkIndicatorSlotAttrs(isDisabled: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.slot, isDisabled ? styles.disabled : styles.enabled, xstyle);
}

/** Icon's size for an indicator size. Both tiers resolve to Icon's `sm` box. */
export function checkIndicatorIconSize(size: IndicatorSize): 'sm' {
	return iconSizeForIndicator[size];
}
