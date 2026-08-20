import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../internal/sx.js';
import { radiusVars } from '../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../utils/focus-outline.stylex.js';

/**
 * `useInputStatusIcon`'s styles, ported from Astryx's
 * `hooks/useInputStatusIcon.tsx`.
 */
const styles = stylex.create({
	// Declared by upstream but never applied — the affordance is a bare button
	// with no anchor wrapper around it. Kept so the compiled atomic classes match
	// dist, the same way `Switch`'s `description` group is.
	iconAnchor: {
		display: 'inline-flex',
		alignItems: 'center'
	},
	// The tooltip-variant status affordance is a real button so it is keyboard
	// focusable and tappable. Strip the native chrome and show only a focus ring.
	statusButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		margin: 0,
		border: 'none',
		background: 'none',
		color: 'inherit',
		cursor: 'pointer',
		// Own the interactivity so the tooltip opens on hover even when the field
		// renders this affordance inside a non-interactive trailing slot. TextArea
		// positions its end slot as an absolute overlay with `pointer-events: none`
		// (right for the decorative spinner/icon it was built for), which otherwise
		// swallows this button's hover — keyboard focus still worked, pointer did
		// not.
		pointerEvents: 'auto',
		borderRadius: radiusVars['--radius-full'],
		// Not the shared offset: this button sits inside the field, and measured at
		// the standard 3px its ring crosses the field border.
		outlineOffset: { default: null, ':focus-visible': '2px' }
	}
});

/** The focusable info-tip button that carries the on-field status glyph. */
export function inputStatusButtonAttrs(): SvelteStyleAttrs {
	return sx(focusOutlineStyles.focusVisible, styles.statusButton);
}
