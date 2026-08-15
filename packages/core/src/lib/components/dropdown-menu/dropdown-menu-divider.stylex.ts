import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * `DropdownMenuDivider`'s style, ported from Astryx's
 * `DropdownMenu/DropdownMenuDivider.tsx`.
 *
 * One key: the vertical breathing room around the rule. Everything else the
 * separator needs is `Divider`'s.
 */
const styles = stylex.create({
	divider: {
		marginBlock: spacingVars['--spacing-1']
	}
});

/** Composed into `Divider`'s `xstyle`, so a caller's own override still wins. */
export const dropdownMenuDividerStyle: StyleArg = styles.divider;
