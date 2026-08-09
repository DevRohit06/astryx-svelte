import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `CheckboxList/CheckboxListItem.tsx` styles.
 *
 * The checked row's tint is applied through `xstyle`, **not** through
 * `ListItem`'s `isSelected` — upstream deliberately avoids the latter because
 * `Item` renders `aria-selected` for it, which is invalid on `role="listitem"`
 * and is directly contradicted by three of `CheckboxList`'s own test cases.
 *
 * The one key survives into upstream's `dist/` as an object because it reaches
 * `ListItem` inside an `xstyle` array beside a conditional. It is a duplicate
 * declaration of `Item`'s own `styles.selected` against the same token, so it
 * compiles to the same atomic class.
 */
const styles = stylex.create({
	selected: {
		backgroundColor: colorVars['--color-accent-muted']
	}
});

/** The `xstyle` array `CheckboxListItem` hands to `ListItem`. */
export function checkboxListItemXstyle(isSelected: boolean, xstyle: StyleArg): StyleArg {
	return [isSelected && styles.selected, xstyle];
}
