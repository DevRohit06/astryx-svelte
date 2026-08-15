import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typographyVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/** The menu size, driven by the trigger button's size. */
export type DropdownMenuSize = 'sm' | 'md' | 'lg';

const menuItemStyles = stylex.create({
	root: {
		boxSizing: 'border-box',
		width: '100%',
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		borderRadius: `max(0px, calc(var(--_dropdown-menu-radius, ${spacingVars['--spacing-2']}) - var(--_dropdown-menu-padding, ${spacingVars['--spacing-1']})))`,
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary'],
		// Focus is the *sole* highlight source: `focusMenuItemOnHover` moves focus
		// to the pointed-at row, so a `:hover` background here would leave the
		// keyboard-focused row highlighted at the same time as the hovered one.
		backgroundColor: {
			default: 'transparent',
			':focus': colorVars['--color-overlay-hover']
		},
		border: 'none',
		cursor: 'pointer',
		textAlign: 'start',
		outline: 'none'
	},
	disabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	},
	destructive: {
		// Only recolor the text/icon; the hover / focus background stays the shared
		// neutral overlay from `root` so the hover state matches every other menu
		// item. The root color covers the label/description via the Item custom
		// properties (and any bare text). Semantic error tokens keep it theme-aware.
		color: colorVars['--color-error'],
		'--_item-label-color': colorVars['--color-error'],
		'--_item-description-color': colorVars['--color-error']
	}
});

const itemSizeStyles = stylex.create({
	sm: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2']
	},
	md: {
		paddingBlock: spacingVars['--spacing-1-5']
	},
	lg: {}
});

/**
 * The `xstyle` array passed to `Item` — upstream's
 * `[menuItemStyles.root, itemSizeStyles[size], isDestructive && menuItemStyles.destructive,
 * isDisabled && menuItemStyles.disabled, xstyle]`.
 */
export function dropdownMenuItemXstyle(
	size: DropdownMenuSize,
	isDisabled: boolean,
	isDestructive: boolean,
	xstyle?: StyleArg
): StyleArg {
	return [
		menuItemStyles.root,
		itemSizeStyles[size],
		isDestructive && menuItemStyles.destructive,
		isDisabled && menuItemStyles.disabled,
		xstyle
	];
}
