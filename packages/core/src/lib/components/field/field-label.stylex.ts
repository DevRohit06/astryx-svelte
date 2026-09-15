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
	labelGroup: {
		display: 'flex',
		flexDirection: 'column'
	},
	// A hidden label group must not take a slot in the caller's layout, or an
	// empty box would draw the caller's gap around nothing. Dropping the wrapper
	// box leaves the sr-only children out of flow directly under the caller, so
	// the group occupies no space at all.
	labelGroupHidden: {
		display: 'contents'
	},
	label: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	labelDisabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'default'
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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
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
/**
 * The wrapper around the label and its description. Rendered only when there is
 * a description: without one, upstream leaves the label itself as the caller's
 * flex/grid item so the caller's layout overrides keep applying to it.
 */
export function fieldLabelGroupAttrs(isLabelHidden: boolean): SvelteStyleAttrs {
	return sx(styles.labelGroup, isLabelHidden && styles.labelGroupHidden);
}

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
