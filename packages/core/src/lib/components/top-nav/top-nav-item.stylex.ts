import * as stylex from '@stylexjs/stylex';
import type { StyleArg, SvelteStyleAttrs } from '../../internal/sx.js';
import { navItemStyles, type NavItemSize } from '../nav-item/nav-item.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNavItem.tsx` styles.
 *
 * Two appearances from one component, picked by `TopNavRenderContext`: the
 * horizontal pill of a desktop top bar (`base`/`selected`/`iconOnly`), and — in
 * `'drawer'` mode — a `SideNavItem`-shaped row built on the shared
 * {@link navItemStyles}, so TopNav and SideNav items sit flush in the combined
 * mobile drawer. `drawerFocus` is the only style the drawer branch adds; the
 * rest of that row is `navItemStyles`.
 */
const styles = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1-5'],
		paddingInline: spacingVars['--spacing-3'],
		borderRadius: radiusVars['--radius-element'],
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary'],
		textDecoration: 'none',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		transitionProperty: 'background-color, color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: {
			default: 'transparent',
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			},
			':active': colorVars['--color-overlay-pressed']
		}
	},
	selected: {
		color: colorVars['--color-text-primary'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		backgroundColor: {
			default: colorVars['--color-neutral'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': colorVars['--color-neutral']
			},
			':active': colorVars['--color-neutral']
		}
	},
	iconOnly: {
		paddingInline: spacingVars['--spacing-2']
	}
	// Drawer mode — focus outline (base item + selected come from navItemStyles)
});

/** The drawer-mode row — the shared nav item plus this component's focus ring. */
export function topNavItemDrawerAttrs(
	size: NavItemSize,
	isSelected: boolean,
	isDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		navItemStyles.item,
		navItemStyles[size],
		isSelected && navItemStyles.selected,
		isDisabled && navItemStyles.disabled,
		xstyle
	);
}

/**
 * The default / mobile-bar horizontal pill. `size` has no effect here — it is a
 * drawer-only control, which is what the prop's docstring says upstream.
 */
export function topNavItemAttrs(
	isSelected: boolean,
	isDisabled: boolean,
	isIconOnly: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.base,
		isSelected && styles.selected,
		isDisabled && navItemStyles.disabled,
		isIconOnly && styles.iconOnly,
		xstyle
	);
}
