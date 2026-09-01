import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { navItemStyles, type NavItemSize } from '../nav-item/nav-item.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNavItem.tsx` styles.
 *
 * The row itself comes from the shared {@link navItemStyles}; everything here is
 * what `SideNavItem` layers on top — the collapsed icon-only square, the
 * truncating label, the nested-children disclosure, and the split-action row.
 *
 * The row-wrapper shape is the one worth understanding. When the row carries
 * more than one control — an independent chevron toggle (collapsible *and* a
 * primary action), consumer-supplied `actions`, or both — the extra control
 * cannot be a `<button>` inside the `<a>`, because nesting interactive elements
 * is invalid. So the row becomes a `<div>` carrying the nav-item styling, with
 * the link/button (`splitAction`, `flex: 1` for a wide target), the chevron
 * toggle (`expandToggle`) and the `actions` slot as siblings inside it.
 *
 * `styles.children` is declared upstream and applied nowhere — `childrenInner`
 * superseded it. Ported for shape parity; StyleX drops unreferenced keys, so it
 * emits nothing on either side.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		width: '100%'
	},
	itemCollapsed: {
		justifyContent: 'center',
		width: sizeVars['--size-element-md'],
		paddingInline: 0
	},
	itemCollapsedSm: { width: sizeVars['--size-element-sm'] },
	itemCollapsedLg: { width: sizeVars['--size-element-lg'] },
	label: {
		flex: 1,
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	endContent: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center'
	},
	// Row-level secondary controls (actions slot) — siblings of the primary
	// element at the trailing edge of the row. pointerEvents opts back in when
	// a disabled row's navItemStyles.disabled sets pointer-events: none on the
	// wrapper: the slot is passthrough, so each control owns its own disabled
	// state (keyboard focus already reaches it either way).
	actions: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		pointerEvents: 'auto'
	},
	children: {
		paddingInlineStart: spacingVars['--spacing-6']
	},
	childrenCollapsible: {
		display: 'grid',
		gridTemplateRows: '1fr',
		transitionProperty: 'grid-template-rows',
		transitionDuration: {
			default: durationVars['--duration-medium'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	childrenCollapsed: {
		gridTemplateRows: '0fr'
	},
	childrenInner: {
		overflow: 'hidden',
		minHeight: 0,
		paddingInlineStart: spacingVars['--spacing-6']
	},
	expandChevron: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: spacingVars['--spacing-6'],
		height: spacingVars['--spacing-6'],
		// Icon's `lg` would also set font-size: 1.5rem, and the registry chevron
		// is a 1em SVG — that would blow the glyph up from the 14px it inherits
		// from the row to the full 24px box. The 24px box is the touch/alignment
		// target, not the glyph size, so keep the glyph on the inherited size.
		fontSize: 'inherit',
		transitionProperty: 'transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		flexShrink: 0
	},
	expandChevronExpanded: {
		transform: 'rotate(180deg)'
	},
	// Standalone toggle button for the chevron when collapsible + href.
	expandToggle: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		color: 'inherit',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element'],
		// Upstream 0.5.1 gives the standalone toggle an explicit box so it keeps a
		// full target when it sits beside an href/onClick primary.
		height: sizeVars['--size-element-sm'],
		width: sizeVars['--size-element-sm']
	},
	// Primary action element inside the split-action row (link or button).
	// Flex:1 so it fills remaining space, giving a wide click target.
	// Resets both link and button appearance so it blends into the row.
	splitAction: {
		display: 'flex',
		alignItems: 'center',
		alignSelf: 'stretch',
		gap: spacingVars['--spacing-2'],
		flex: 1,
		minWidth: 0,
		color: 'inherit',
		textDecoration: 'none',
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		lineHeight: 'inherit',
		textAlign: 'start',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	// Popover surface for collapsed items with children
	// No border and no background: `usePopover` paints the panel this renders
	// into. Drawing a second surface here put square corners inside its rounded
	// ones. The radius matches so a theme retargeting `--radius-container`
	// keeps the two in step.
	popoverSurface: {
		borderRadius: radiusVars['--radius-container'],
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-1'],
		minWidth: 180
	},
	// The gap from the rail belongs on the positioned layer, where
	// `DropdownMenu` keeps it. On the content div it insets the content instead,
	// leaving the panel flush against the rail.
	popoverGap: {
		marginInlineStart: spacingVars['--spacing-1'],
		marginInlineEnd: spacingVars['--spacing-1']
	},
	popoverHeader: {
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1'],
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-secondary'],
		lineHeight: typeScaleVars['--text-supporting-leading']
	}
});

/**
 * The item's outer column — the row plus any nested children. `xstyle` lands
 * here because it is the component's outermost box; upstream drops it entirely
 * (see the component's closed-prop-root note).
 */
export function sideNavItemRootAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/**
 * The expanded row: the shared nav item with selected/disabled applied.
 *
 * Three shapes of one appearance, and which builder to reach for is a question
 * about where the focus ring belongs:
 *
 * - `sideNavItemRowAttrs` — the row-wrapper path with an independent toggle and
 *   no `actions`: a presentational `<div>` whose *children* are the tab stops,
 *   so the ring belongs on each of them and this builder must not draw it.
 * - `sideNavItemFocusableRowAttrs` — the ordinary row, where the row element is
 *   itself the focusable control.
 * - `sideNavItemActionsRowAttrs` — the same pill, but the ring is drawn for the
 *   *primary only*. The wrapper is not a tab stop, so its own `:focus-visible`
 *   would never match, and ringing on any descendant instead would light the
 *   whole row around the chevron's or an action's own ring.
 */
export function sideNavItemRowAttrs(
	size: NavItemSize,
	isSelected: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(...rowStyleArgs(size, isSelected, isDisabled));
}

function rowStyleArgs(size: NavItemSize, isSelected: boolean, isDisabled: boolean): StyleArg[] {
	return [
		navItemStyles.item,
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		interactionOverlayStyles.backgroundColor,
		navItemStyles[size],
		isSelected && navItemStyles.selected,
		isDisabled && navItemStyles.disabled
	];
}

/** The expanded row when the row element is the focusable control. */
export function sideNavItemFocusableRowAttrs(
	size: NavItemSize,
	isSelected: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(...rowStyleArgs(size, isSelected, isDisabled));
}

/**
 * The expanded row when it carries an `actions` slot — the ring is scoped to the
 * wrapper's first child, which is the primary link/button. Pair it with
 * {@link sideNavItemSplitActionSuppressedAttrs} on that primary, so the UA's own
 * ring does not paint inside this one.
 */
export function sideNavItemActionsRowAttrs(
	size: NavItemSize,
	isSelected: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return focusOutlineProps.focusWithinFirstChild(...rowStyleArgs(size, isSelected, isDisabled));
}

/** The collapsed icon-only square — a fixed width matching the size ramp. */
export function sideNavItemCollapsedAttrs(
	size: NavItemSize,
	isSelected: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	// All three collapsed shapes — trigger, link and button — render a focusable
	// element, so each draws the shared ring.
	return focusOutlineProps.focusVisible(
		navItemStyles.item,
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		interactionOverlayStyles.backgroundColor,
		navItemStyles[size],
		styles.itemCollapsed,
		size === 'sm' && styles.itemCollapsedSm,
		size === 'lg' && styles.itemCollapsedLg,
		isSelected && navItemStyles.selected,
		isDisabled && navItemStyles.disabled
	);
}

/** The truncating label. */
export function sideNavItemLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.label);
}

/** The trailing slot for badges and counts. */
export function sideNavItemEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.endContent);
}

/**
 * The `actions` slot — row-level secondary controls, siblings of the primary
 * element at the trailing edge of the row.
 *
 * `pointerEvents: auto` is the load-bearing half. A disabled row's
 * `navItemStyles.disabled` sets `pointer-events: none` on the wrapper, and this
 * slot opts back in: the content is passthrough, so each control owns its own
 * disabled state (keyboard focus already reaches it either way).
 */
export function sideNavItemActionsAttrs(): SvelteStyleAttrs {
	return sx(styles.actions);
}

/** The `0fr ↔ 1fr` grid that animates nested children open and shut. */
export function sideNavItemChildrenAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.childrenCollapsible, isCollapsed && styles.childrenCollapsed);
}

/** The clipped, indented inner track holding the nested items. */
export function sideNavItemChildrenInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.childrenInner);
}

/**
 * The disclosure chevron, rotated while expanded. Passed to the `Icon`'s
 * `xstyle` the way upstream passes the pair (#4838), so the 24px box and the
 * rotation land on the element a theme targets rather than a wrapper `<span>`.
 */
export const sideNavItemChevronStyle = styles.expandChevron;
export const sideNavItemChevronExpandedStyle = styles.expandChevronExpanded;

/** The chevron as its own button, in the split-action row. */
export function sideNavItemExpandToggleAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.expandToggle,
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		interactionOverlayStyles.backgroundColor
	);
}

/** The primary link/button in the split-action row. */
export function sideNavItemSplitActionAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.splitAction);
}

/**
 * The same primary link/button when the row carries `actions`. The wrapper rings
 * for this element ({@link sideNavItemActionsRowAttrs}); suppressing here is what
 * keeps the UA's own ring from painting inside that one.
 */
export function sideNavItemSplitActionSuppressedAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.suppressed(styles.splitAction);
}

/** The flyout shown for a collapsed item that has children. */
export function sideNavItemPopoverSurfaceAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverSurface);
}

/** The flyout's heading, which repeats the item's label. */
export function sideNavItemPopoverHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverHeader);
}

/** The gap from the rail, applied to the positioned layer rather than the content. */
export const sideNavItemPopoverGapStyle = styles.popoverGap;
