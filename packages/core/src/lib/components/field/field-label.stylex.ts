import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Field/FieldLabel.tsx`.
 *
 * `srOnly` is declared here rather than reusing `VisuallyHidden`'s, and that is
 * deliberate: upstream's uses the **physical** `left`/`top`, where ours uses the
 * logical `insetInlineStart`/`insetBlockStart`.
 *
 * The divergence is one class wide, on the inline axis only — StyleX collapses
 * `insetBlockStart` and `top` to the same atomic class, since the block axis is
 * not RTL-flippable, but keeps `inset-inline-start:0` (`x1o0tod`) distinct from
 * `left:0` (`xu96u03`). Sharing would emit CSS upstream does not.
 */
const styles = stylex.create({
	label: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary'],
		cursor: 'pointer'
	},
	labelDisabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'not-allowed'
	},
	srOnly: {
		borderStyle: 'none',
		clip: 'rect(0, 0, 0, 0)',
		height: 1,
		insetInlineStart: 0,
		margin: -1,
		overflow: 'hidden',
		padding: 0,
		pointerEvents: 'none',
		position: 'absolute',
		top: 0,
		userSelect: 'none',
		whiteSpace: 'nowrap',
		width: 1
	},
	optionalRequired: {
		fontWeight: fontWeightVars['--font-weight-normal'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	description: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	},
	// When the description forwards clicks to a click-activatable control
	// (checkbox/switch), it reads as part of the same hit target as the label.
	descriptionClickable: {
		cursor: 'pointer'
	}
});

/** The label element itself — `<label>`, or `<span>` for a group label. */
export function fieldLabelAttrs(
	isDisabled: boolean,
	isLabelHidden: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.label,
		isDisabled && styles.labelDisabled,
		isLabelHidden && styles.srOnly,
		xstyle
	);
}

/** The trailing "Optional" / "Required" run inside the label. */
export function fieldLabelStatusTextAttrs(): SvelteStyleAttrs {
	return sx(styles.optionalRequired);
}

/**
 * The description that follows the label. `isClickable` adds the pointer cursor
 * for the 0.3.0 description-click forwarding — it is only set when forwarding is
 * actually active, so a group label (which has no single control to forward to)
 * keeps the default cursor.
 */
export function fieldLabelDescriptionAttrs(
	isLabelHidden: boolean,
	isClickable = false
): SvelteStyleAttrs {
	// Upstream's order — `descriptionClickable` BEFORE `srOnly`. Composition order
	// decides which declaration wins on a shared property, so this is not
	// cosmetic; reversing it changes the emitted class string.
	return sx(
		styles.description,
		isClickable && styles.descriptionClickable,
		isLabelHidden && styles.srOnly
	);
}
