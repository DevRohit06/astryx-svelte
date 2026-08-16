import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `NavItem/navItemStyles.stylex.ts`.
 *
 * Upstream's `NavItem/` directory holds exactly one file and no component: the
 * shared nav-item appearance that `SideNavItem`, `TopNavItem` (drawer mode),
 * `TopNavMenu` (drawer mode), `TopNavMegaMenu*` and `SideNavHeading` (collapsed)
 * all compose, so a TopNav item rendered inside a MobileNav drawer sits flush
 * with the SideNav items beside it.
 *
 * It is **internal on both sides**. Upstream's root barrel carries the comment
 * "NavItem (navItemStyles) is internal", its `package.json` publishes no
 * `./navItemStyles` subpath, and the module's own docstring example importing
 * one is aspirational rather than shipped — so nothing here reaches our barrel
 * either.
 *
 * Unlike every other `.stylex.ts` in this port, the compiled objects are
 * exported directly rather than only through `*Attrs` helpers. Consumers merge
 * them *into their own* `stylex.props` calls (upstream does the same), and the
 * class oracle needs the merge to happen in one call to stay byte-identical —
 * so a helper per consumer would be the wrong seam. The `navItemAttrs` helper
 * below covers the one shape several consumers share verbatim.
 *
 * `borderStyle: 'none'` and `borderWidth: 0` are written out longhand upstream,
 * not as the `border` shorthand StyleX silently drops — see port/todo.md → Phase 0.
 */

/** Size ramp shared by every nav item. Upstream's `NavItemSize`. */
export type NavItemSize = 'sm' | 'md' | 'lg';

export const navItemStyles = stylex.create({
	/** Base interactive nav item — layout, typography, hover/active states */
	item: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		height: sizeVars['--size-element-md'],
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: 0,
		borderRadius: radiusVars['--radius-element'],
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		color: colorVars['--color-text-primary'],
		textDecoration: 'none',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		lineHeight: typeScaleVars['--text-label-leading'],
		textAlign: 'start',
		boxSizing: 'border-box',
		':hover': {
			'@media (hover: hover)': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		},
		':active': {
			backgroundColor: colorVars['--color-overlay-pressed']
		}
	},

	/** Selected/active page indicator — deemphasized background, medium weight */
	selected: {
		backgroundColor: colorVars['--color-neutral'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		':hover': {
			'@media (hover: hover)': {
				backgroundColor: colorVars['--color-neutral']
			}
		},
		':active': {
			backgroundColor: colorVars['--color-neutral']
		}
	},

	/** Disabled state — muted color, no interaction */
	disabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'not-allowed',
		pointerEvents: 'none' as const
	},

	/** Small size variant */
	sm: {
		height: sizeVars['--size-element-sm'],
		paddingInline: spacingVars['--spacing-1']
	},

	/** Medium size variant (default) */
	md: {
		height: sizeVars['--size-element-md'],
		paddingInline: spacingVars['--spacing-2']
	},

	/** Large size variant */
	lg: {
		height: sizeVars['--size-element-lg'],
		paddingInline: spacingVars['--spacing-2']
	}
});

/**
 * The `item` + size + selected/disabled combination several nav items apply
 * unchanged. Callers that layer further styles (a collapsed width, an
 * indentation, a focus outline) build the whole merge themselves so StyleX still
 * resolves it in one call.
 */
export function navItemAttrs(
	size: NavItemSize,
	isSelected: boolean,
	isDisabled: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		navItemStyles.item,
		navItemStyles[size],
		isSelected && navItemStyles.selected,
		isDisabled && navItemStyles.disabled,
		xstyle
	);
}
