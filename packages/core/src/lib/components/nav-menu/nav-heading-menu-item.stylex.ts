import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import type { NavHeadingMenuSize } from './nav-menu-context.svelte.js';

/**
 * Ported from Astryx's `NavMenu/NavHeadingMenuItem.tsx` styles.
 *
 * `root`/`disabled` and the size ramp stay objects in upstream's `dist/` — the
 * item's single call site merges a dynamic index, a conditional and an `xstyle`
 * spread. `content` is the one style the compiler could resolve: it is applied
 * alone at exactly one call site, so `dist/` carries the finished class string
 * and no object.
 *
 * `border: 'none'` emits nothing (StyleX drops the shorthand); the reset's
 * universal `border-width: 0` is what actually removes it. Kept for parity — see
 * TODO.md → Phase 0.
 */
const styles = stylex.create({
	root: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		borderRadius: radiusVars['--radius-element'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary'],
		backgroundColor: {
			default: 'transparent',
			':focus': colorVars['--color-overlay-hover'],
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		border: 'none',
		cursor: 'pointer',
		textAlign: 'start',
		outline: 'none',
		textDecoration: 'none'
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0
	},
	disabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	}
});

const sizeStyles = stylex.create({
	sm: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2']
	},
	md: {
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2']
	},
	lg: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-3']
	}
});

/** The `role="menuitem"` root — an `<a>` with `href`, a `<div>` without. */
export function navHeadingMenuItemAttrs(
	size: NavHeadingMenuSize,
	isDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.root, sizeStyles[size], isDisabled && styles.disabled, xstyle);
}

/** The label/description column between the icon and the item's end. */
export function navHeadingMenuItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}
