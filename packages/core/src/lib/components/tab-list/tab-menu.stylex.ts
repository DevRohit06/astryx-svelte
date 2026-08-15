import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
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
import { tabScope } from './tab.markers.stylex.js';
import type { TabListSize } from './tab-list-context.svelte.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `TabList/TabMenu.tsx` styles.
 *
 * Both modes, plus the shared `tabScope` marker. Only `trigger`,
 * `triggerSelected` and `hoverBg` survive as objects in upstream's `dist/` (the
 * trigger merges a dynamic size index, a conditional, the marker and an `xstyle`
 * spread; the hover pill merges a dynamic size index). Everything else folded
 * into a literal class string.
 *
 * `itemCheckmark` is declared upstream and never applied — the selected tick is
 * an `<Icon icon="check">`, not a styled span. It is ported for parity and is
 * therefore the one key with no upstream counterpart to diff against, in either
 * mode.
 */
const styles = stylex.create({
	trigger: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-3'],
		backgroundColor: 'transparent',
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: radiusVars['--radius-element'],
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary'],
		cursor: 'pointer',
		textDecoration: 'none',
		transitionProperty: 'color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	triggerSelected: {
		color: colorVars['--color-text-primary'],
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	triggerLabel: {
		position: 'relative',
		display: 'inline-grid',
		alignItems: 'center',
		alignSelf: 'stretch'
	},
	triggerLabelText: {
		gridRowStart: 1,
		gridColumnStart: 1
	},
	triggerLabelSizer: {
		gridRowStart: 1,
		gridColumnStart: 1,
		visibility: 'hidden',
		pointerEvents: 'none',
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	indicator: {
		position: 'absolute',
		// Mirrors Tab's indicator: sits on the bottom edge by default (-1px), or
		// drops onto the divider rail when an ancestor (TabList `hasDivider` or a
		// Toolbar with a bottom divider) sets `--_tab-indicator-bottom`.
		bottom: 'var(--_tab-indicator-bottom, -1px)',
		insetInlineStart: spacingVars['--spacing-3'],
		insetInlineEnd: spacingVars['--spacing-3'],
		height: '2px',
		borderRadius: radiusVars['--radius-full'],
		pointerEvents: 'none',
		transitionProperty: 'opacity, background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	indicatorSelected: {
		backgroundColor: colorVars['--color-icon-primary'],
		opacity: 1
	},
	hoverBg: {
		position: 'absolute',
		inset: 0,
		margin: 'auto',
		width: '100%',
		borderRadius: radiusVars['--radius-element'],
		pointerEvents: 'none',
		backgroundColor: {
			default: 'transparent',
			[stylex.when.ancestor(':hover', tabScope)]: {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevron: {
		width: spacingVars['--spacing-4'],
		height: spacingVars['--spacing-4'],
		flexShrink: 0,
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronOpen: {
		transform: 'rotate(180deg)'
	},
	dropdown: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-1']
	},
	menuItem: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3'],
		borderRadius: radiusVars['--radius-element'],
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-primary'],
		cursor: 'pointer',
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: {
			default: 'transparent',
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		}
	},
	menuItemSelected: {
		fontWeight: fontWeightVars['--font-weight-medium']
	},
	menuItemContent: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	itemCheckmark: {
		flexShrink: 0,
		width: 16,
		height: 16,
		color: colorVars['--color-icon-primary']
	},
	menuHeading: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-secondary'],
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-3']
	}
});

const sizeStyles = stylex.create({
	sm: { height: sizeVars['--size-element-sm'] },
	md: { height: sizeVars['--size-element-md'] },
	lg: { height: sizeVars['--size-element-lg'] }
});

// Hover bg uses the standard element size (one step smaller than tab)
const hoverSizeStyles = stylex.create({
	sm: { height: sizeVars['--size-element-sm'] },
	md: { height: sizeVars['--size-element-md'] },
	lg: { height: sizeVars['--size-element-lg'] }
});

/** The trigger `<button>`. */
export function tabMenuTriggerAttrs(
	size: TabListSize,
	hasSelectedOption: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.trigger,
		sizeStyles[size],
		hasSelectedOption && styles.triggerSelected,
		tabScope,
		xstyle
	);
}

/** The absolutely-positioned hover pill behind the trigger's content. */
export function tabMenuHoverBgAttrs(size: TabListSize): SvelteStyleAttrs {
	return sx(styles.hoverBg, hoverSizeStyles[size]);
}

/** The trigger label's overlapping-cell grid. */
export function tabMenuTriggerLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerLabel);
}

/** The visible trigger label cell. */
export function tabMenuTriggerLabelTextAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerLabelText);
}

/** The invisible semibold cell that reserves the selected width. */
export function tabMenuTriggerLabelSizerAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerLabelSizer);
}

/** The chevron, rotated while the menu is open. */
export function tabMenuChevronAttrs(isOpen: boolean): SvelteStyleAttrs {
	return sx(styles.chevron, isOpen && styles.chevronOpen);
}

/** The selected-state rule under the trigger. Rendered only when selected. */
export function tabMenuIndicatorAttrs(): SvelteStyleAttrs {
	return sx(styles.indicator, styles.indicatorSelected);
}

/** The `role="menu"` popup body. */
export function tabMenuDropdownAttrs(): SvelteStyleAttrs {
	return sx(styles.dropdown);
}

/** The `role="presentation"` heading above the options. */
export function tabMenuHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.menuHeading);
}

/** One `role="menuitem"` row. */
export function tabMenuItemAttrs(isSelected: boolean): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.menuItem, isSelected && styles.menuItemSelected);
}

/** The icon + label group inside a row. */
export function tabMenuItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.menuItemContent);
}
