import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Field/PanelSearchInput.tsx`, where the styles are inline
 * in the component file rather than in a module of their own. The group name
 * (`styles`) is upstream's, so it needs no rename.
 */

const styles = stylex.create({
	// Gutter only. Matches the option list's own padding so the field below
	// lines up with the option rows rather than with the panel edge.
	wrapper: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-1']
	},
	// The field proper — the same box an option row draws: `--radius-element`
	// corners and, at md, a 6/8 padding pair that lands it on the option row's
	// 32px height. Focus rings THIS, not the full-width row.
	field: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		paddingBlock: spacingVars['--spacing-1-5'],
		paddingInline: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-element'],
		transitionProperty: 'box-shadow',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	// The focus ring, applied only while focus was taken by keyboard (see
	// `isKeyboardFocus`). `:has(input:focus-visible)` stays the CSS condition —
	// the browser's heuristic still decides, this only narrows it — and rings
	// the field rather than the bare <input> so the magnifier and the clear
	// button sit inside it, and so tabbing ONTO the clear button does not
	// re-ring the field.
	//
	// **An INSET box-shadow, not the shared `focusOutlineStyles` ring, and that
	// is deliberate.** It is the one sanctioned exception to this family's
	// shared-ring rule: the field is inset 4-5px from the panel edge, so the
	// shared outline's 3px offset would land the ring on the panel's own border
	// and on the divider under the row. Measured upstream, not guessed — do not
	// "fix" it back to `focusOutlineStyles`.
	fieldKeyboardFocus: {
		boxShadow: {
			default: 'none',
			':has(input:focus-visible)': `inset 0 0 0 2px ${colorVars['--color-accent']}`
		}
	},
	// The icon span needs explicit flex centering to avoid a line-height offset.
	icon: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0
	},
	input: {
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		color: colorVars['--color-text-primary'],
		fontFamily: typographyVars['--font-family-body'],
		// Matches the option rows below it, so the query reads as the first line of
		// the list. The coarse-pointer floor keeps iOS from zooming on focus.
		fontSize: {
			default: typeScaleVars['--text-label-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-label-size']})`
		},
		lineHeight: typeScaleVars['--text-label-leading'],
		// The field draws the focus ring (see `field`), so the bare input must not
		// draw a second one inside it.
		outline: 'none',
		'::placeholder': {
			color: colorVars['--color-text-secondary']
		}
	}
});

/** The outer row — gutter only, plus the caller's `xstyle`. */
export function panelSearchWrapperAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}

/** The rounded, option-row-shaped box holding the magnifier, input and clear. */
export function panelSearchFieldAttrs(isKeyboardFocus: boolean): SvelteStyleAttrs {
	return sx(styles.field, isKeyboardFocus && styles.fieldKeyboardFocus);
}

/** `xstyle` for the leading magnifier `<Icon>`. */
export const panelSearchIconStyle: StyleArg = styles.icon;

/** The borderless `<input>` itself. */
export function panelSearchInputAttrs(): SvelteStyleAttrs {
	return sx(styles.input);
}
