import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { sizeVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `InputGroup/InputGroup.tsx`.
 *
 * The group is a flex row whose height is fixed by size; the member controls
 * carry the border-collapsing corners (see `group-styles.stylex.ts`), so the
 * group itself only lays them out and dims on disable.
 */

const styles = stylex.create({
	group: {
		display: 'inline-flex',
		alignItems: 'stretch',
		backgroundColor: 'transparent'
	},
	disabled: {
		cursor: 'not-allowed',
		opacity: 0.5
	}
});

const sizeStyles = stylex.create({
	sm: {
		height: sizeVars['--size-element-sm']
	},
	md: {
		height: sizeVars['--size-element-md']
	},
	lg: {
		height: sizeVars['--size-element-lg']
	}
});

export type InputGroupSize = keyof typeof sizeStyles;

/** The group row: layout, height and the disabled dim. */
export function inputGroupAttrs(
	size: InputGroupSize,
	isDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.group, sizeStyles[size], isDisabled && styles.disabled, xstyle);
}
