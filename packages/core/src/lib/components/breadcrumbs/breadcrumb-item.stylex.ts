import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, radiusVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Breadcrumbs/BreadcrumbItem.tsx` styles.
 *
 * Only `root` and the two size variants survive as objects in upstream's
 * `dist/` — they reach `stylex.props` beside a variant ternary and an `xstyle`
 * spread. Everything else is a single call site the compiler folded into a
 * literal class string.
 *
 * `root` declares the `--separator-display` custom property, which is what hides
 * the leading separator on the first item: each item renders its own separator
 * and `:first-child` sets the property to `none`. That keeps the separator out
 * of the DOM order question entirely — no separator `<li>`s to skip when finding
 * the last item.
 */
const itemStyles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		margin: 0,
		'--separator-display': {
			default: 'flex',
			':first-child': 'none'
		}
	},
	defaultSize: {
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading']
	},
	supportingSize: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading']
	},
	contentWrapper: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	link: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		paddingBlock: spacingVars['--spacing-1'],
		textDecoration: {
			default: 'none',
			':hover': {
				'@media (hover: hover)': 'underline'
			}
		},
		cursor: 'pointer'
	},
	// Reset native button styles so onclick-only items match link appearance
	buttonReset: {
		background: 'none',
		border: 'none',
		padding: 0,
		margin: 0,
		font: 'inherit'
	},
	defaultLink: {
		color: colorVars['--color-text-secondary']
	},
	supportingLink: {
		color: colorVars['--color-text-secondary']
	},
	current: {
		fontWeight: 'inherit'
	},
	defaultCurrent: {
		color: colorVars['--color-text-primary']
	},
	supportingCurrent: {
		color: colorVars['--color-text-secondary']
	},
	icon: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0
	},
	chevron: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0,
		// Sized off supporting text (12px) — exactly Icon's `xsm` box at the
		// default type scale. Width/height stay on the token so the box and the
		// glyph keep matching if a theme retunes the supporting step.
		width: typeScaleVars['--text-supporting-size'],
		height: typeScaleVars['--text-supporting-size'],
		fontSize: typeScaleVars['--text-supporting-size']
	},
	separator: {
		display: 'var(--separator-display)',
		alignItems: 'center',
		color: colorVars['--color-text-secondary'],
		paddingBlock: spacingVars['--spacing-1'],
		userSelect: 'none'
	}
});

/** The `<li>`. */
export function breadcrumbItemAttrs(isSupporting: boolean, xstyle: StyleArg): SvelteStyleAttrs {
	return sx(
		itemStyles.root,
		isSupporting ? itemStyles.supportingSize : itemStyles.defaultSize,
		xstyle
	);
}

/** The leading separator span, hidden on the first item by the custom property. */
export function breadcrumbSeparatorAttrs(): SvelteStyleAttrs {
	return sx(itemStyles.separator);
}

/** The non-interactive content wrapper — the current page, or an item with no link. */
export function breadcrumbCurrentAttrs(isSupporting: boolean): SvelteStyleAttrs {
	return sx(
		itemStyles.contentWrapper,
		itemStyles.current,
		isSupporting ? itemStyles.supportingCurrent : itemStyles.defaultCurrent
	);
}

/** The `<a>` branch. */
export function breadcrumbLinkAttrs(isSupporting: boolean): SvelteStyleAttrs {
	return sx(itemStyles.link, isSupporting ? itemStyles.supportingLink : itemStyles.defaultLink);
}

/** The `<button>` branch — the link styles plus a native-button reset. */
export function breadcrumbButtonAttrs(isSupporting: boolean): SvelteStyleAttrs {
	return sx(
		itemStyles.link,
		itemStyles.buttonReset,
		isSupporting ? itemStyles.supportingLink : itemStyles.defaultLink
	);
}

/** The optional leading icon slot. */
export function breadcrumbIconAttrs(): SvelteStyleAttrs {
	return sx(itemStyles.icon);
}

/**
 * The trailing chevron on a menu trigger, passed to the `Icon`'s `xstyle` the
 * way upstream passes `itemStyles.chevron` (#4838). The glyph used to be
 * resolved with `useIcon` and hand-rendered inside a `<span>` — a weaker
 * reimplementation of `Icon`, which already resolves the glyph *and* renders a
 * span carrying the `astryx-icon` theme target. Same node count, one more
 * target.
 */
export const breadcrumbChevronStyle = itemStyles.chevron;

/**
 * The menu surface a `menu` crumb opens. `--_dropdown-menu-radius` and
 * `--_dropdown-menu-padding` are declared here for the same reason
 * `DropdownMenu` declares them: the item rows read them to inset their own
 * corners against the container's, so the pipeline is portable.
 */
const menuStyles = stylex.create({
	menu: {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		maxHeight: '300px',
		overflowY: 'auto',
		'--_dropdown-menu-radius': radiusVars['--radius-container'],
		'--_dropdown-menu-padding': spacingVars['--spacing-1'],
		padding: spacingVars['--spacing-1'],
		borderRadius: 'var(--_dropdown-menu-radius)',
		userSelect: 'none'
	},
	popover: {
		minWidth: '160px',
		marginBlock: spacingVars['--spacing-1']
	}
});

/** The `role="menu"` container inside the popover. */
export function breadcrumbMenuAttrs(): SvelteStyleAttrs {
	return sx(menuStyles.menu);
}

/** The layer's positioned element — passed as `xstyle`, so it stays a style. */
export const breadcrumbMenuPopoverXstyle = menuStyles.popover;
