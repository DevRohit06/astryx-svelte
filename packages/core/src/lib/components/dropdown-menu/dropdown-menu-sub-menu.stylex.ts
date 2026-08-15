import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import type { DropdownMenuSize } from './dropdown-menu-item.stylex.js';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuSubMenu.tsx` styles.
 *
 * The trigger row's groups reach `Item`'s `xstyle` as an array beside a dynamic
 * `triggerSizeStyles[menuSize]` index, so they stay objects exactly as
 * `DropdownMenuItem`'s do. `caret` and `flyoutStyles.menu` each resolve at a
 * single call site.
 *
 * The trigger carries NO `:hover` background: like every other menu row, the
 * single highlight is focus-driven, and `focusMenuItemOnHover` moves focus onto
 * the trigger as the pointer enters it. A `:hover` rule here would paint a
 * second highlight beside the sibling item that still holds focus (0.3.0).
 */
const triggerStyles = stylex.create({
	root: {
		boxSizing: 'border-box',
		width: '100%',
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		borderRadius: `max(0px, calc(var(--_dropdown-menu-radius, ${spacingVars['--spacing-2']}) - var(--_dropdown-menu-padding, ${spacingVars['--spacing-1']})))`,
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary'],
		backgroundColor: {
			default: 'transparent',
			':focus': colorVars['--color-overlay-hover']
		},
		border: 'none',
		cursor: 'pointer',
		textAlign: 'start',
		outline: 'none'
	},
	// While the flyout is open, keep the trigger visibly active so the open
	// branch reads as the current path even when focus has moved into the child.
	open: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	disabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	},
	caret: {
		display: 'flex',
		alignItems: 'center'
	}
});

const triggerSizeStyles = stylex.create({
	sm: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2']
	},
	md: {
		paddingBlock: spacingVars['--spacing-1-5']
	},
	lg: {}
});

const flyoutStyles = stylex.create({
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
		backgroundColor: colorVars['--color-background-popover'],
		boxShadow: shadowVars['--shadow-low'],
		opacity: 1,
		transitionProperty: 'opacity',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	popover: {
		minWidth: '160px'
	},
	popoverCustomWidth: (width: string | number) => ({
		minWidth: typeof width === 'number' ? `${width}px` : width
	})
});

/**
 * The clearance that used to be a hand-rolled `marginInline` pair on both
 * popover styles. It moves to `<PopoverLayer offset>` at 0.4.x (#4951), which
 * sets the gap on both edges of the placement axis — a single-edge margin is
 * stranded on the wrong side when `position-try-fallbacks` flips the flyout.
 */
export const dropdownMenuSubMenuOffset = spacingVars['--spacing-1'];

/** The `xstyle` array handed to the trigger `Item`. */
export function subMenuTriggerXstyle(
	menuSize: DropdownMenuSize,
	isOpen: boolean,
	isDisabled: boolean,
	xstyle?: StyleArg
): StyleArg {
	return [
		triggerStyles.root,
		triggerSizeStyles[menuSize],
		isOpen && triggerStyles.open,
		isDisabled && triggerStyles.disabled,
		xstyle
	];
}

/** The trailing caret (or spinner) wrapper on the trigger row. */
export function subMenuCaretAttrs(): SvelteStyleAttrs {
	return sx(triggerStyles.caret);
}

/** The flyout's `role="menu"` surface. */
export function subMenuFlyoutAttrs(): SvelteStyleAttrs {
	return sx(flyoutStyles.menu);
}

/**
 * The layer's positioned element. A `menuWidth` switches to the dynamic
 * variant, which compiles to a function on both sides — so, as with
 * `DropdownMenu`'s `popoverCustomWidth`, neither extractor sees it.
 */
export function subMenuPopoverXstyle(menuWidth?: number | string): StyleArg {
	return menuWidth ? flyoutStyles.popoverCustomWidth(menuWidth) : flyoutStyles.popover;
}
