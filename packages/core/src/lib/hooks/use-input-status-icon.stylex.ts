import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../internal/sx.js';
import { colorVars, radiusVars } from '../styles/tokens.stylex.js';

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
		borderRadius: radiusVars['--radius-full'],
		outlineWidth: { default: null, ':focus-visible': '2px' },
		outlineStyle: { default: null, ':focus-visible': 'solid' },
		outlineColor: { default: null, ':focus-visible': colorVars['--color-accent'] },
		outlineOffset: { default: null, ':focus-visible': '2px' }
	}
});

/** The focusable info-tip button that carries the on-field status glyph. */
export function inputStatusButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.statusButton);
}
