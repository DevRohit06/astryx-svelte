import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, fontWeightVars } from '../../styles/tokens.stylex.js';

/**
 * Font-weight shift on press with a width-reservation trick: a hidden span renders
 * the same text at semibold to reserve the wider width, preventing layout shift
 * when toggling.
 */
const pressedStyles = stylex.create({
	background: {
		// forced-color-adjust must be `none` here: ToggleButton renders a <button>,
		// and the UA keeps native form-control colors (ButtonFace surface) for it
		// under forced colors, ignoring the authored Highlight fill — the label kept
		// its HighlightText color, giving white text on a white surface. Opting the
		// pressed button out of UA remapping makes both the Highlight surface and
		// the HighlightText label render as authored, restoring figure-ground.
		forcedColorAdjust: 'none',
		backgroundColor: {
			default: colorVars['--color-overlay-pressed'],
			// Forced colors (Windows High Contrast) strips the painted pressed
			// overlay, which would leave icon-only toggles with no pressed
			// indication at all. Highlight/HighlightText is the platform convention
			// for a selected/pressed control (WCAG 1.4.11).
			'@media (forced-colors: active)': 'Highlight'
		},
		color: {
			default: null,
			'@media (forced-colors: active)': 'HighlightText'
		}
	}
});

const labelStyles = stylex.create({
	wrapper: {
		display: 'inline-flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center'
	},
	pressed: {
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	widthReservation: {
		display: 'block',
		fontWeight: fontWeightVars['--font-weight-semibold'],
		height: 0,
		overflow: 'hidden',
		visibility: 'hidden',
		pointerEvents: 'none'
	}
});

/**
 * The `xstyle` array handed to `Button`: the pressed background overlay (a live
 * object `Button` resolves through its own `sx()`) plus the caller's `xstyle`.
 */
export function toggleButtonXstyle(isPressed: boolean, xstyle?: StyleArg): StyleArg {
	return [isPressed ? pressedStyles.background : undefined, xstyle];
}

/** The label wrapper — a visible line plus a hidden semibold width-reservation copy. */
export function toggleButtonWrapperAttrs(): SvelteStyleAttrs {
	return sx(labelStyles.wrapper);
}

/** The visible label line; semibold when pressed. */
export function toggleButtonLabelAttrs(isPressed: boolean): SvelteStyleAttrs {
	return sx(isPressed && labelStyles.pressed);
}

/** The hidden semibold copy that reserves the pressed width. */
export function toggleButtonWidthReservationAttrs(): SvelteStyleAttrs {
	return sx(labelStyles.widthReservation);
}
