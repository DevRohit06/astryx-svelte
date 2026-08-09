import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/selection/useTableSelection.tsx`.
 *
 * Group name is upstream's (`selectionColumnStyles`) so the class oracle needs
 * no rename.
 */

/**
 * The background a selected `<tr>` paints. Upstream assigns this to
 * `el.style.backgroundColor` from a ref callback; the port writes it into the
 * row's `htmlProps.style` instead, so the constant is read at the same place it
 * is declared upstream. StyleX compiles the token reference to a `var()`
 * string, which is what makes it usable as an inline value on either side.
 */
export const selectedBgColor: string = colorVars['--color-accent-muted'];

const selectionColumnStyles = stylex.create({
	center: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	}
});

/** The centring wrapper around the header and cell checkboxes. */
export function selectionCenterAttrs(): SvelteStyleAttrs {
	return sx(selectionColumnStyles.center);
}
