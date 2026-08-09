import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	inputStatusBorderStyles,
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from '../field/input-styles.stylex.js';
import type { InputStatusType } from '../field/types.js';
import { groupStyles } from '../input-group/group-styles.stylex.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Selector/Selector.tsx`, where the styles are inline in
 * the component file rather than in a module of their own. The group names
 * (`styles`/`sizeStyles`/`itemSizeStyles`) are upstream's, so none is renamed.
 *
 * `styles.itemCheckmark` is **dead upstream** — declared and never applied (the
 * selected tick is an `<Icon icon="check">`), so `dist/` folds it away entirely
 * and neither oracle mode has a counterpart to diff it against. Ported for
 * parity anyway, the same standing `tab-menu.stylex.ts`'s identically-named key
 * has. It is the reverse of a skip, as `Collapsible`'s `triggerDisabled` is.
 */

const styles = stylex.create({
	// Trigger container — the enhanced click target wrapping the combobox button and clear button as siblings
	triggerContainer: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-label-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-label-size']})`
		},
		lineHeight: typeScaleVars['--text-label-leading'],
		color: colorVars['--color-text-primary'],
		cursor: 'pointer'
	},
	// Trigger button — the actual combobox button, visually integrated with the container
	trigger: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 0,
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		lineHeight: 'inherit',
		color: 'inherit',
		cursor: 'pointer',
		// The wrapper (inputWrapperStyles.base) renders the focus ring via
		// :focus-within when this button is focused, matching TextInput/NumberInput.
		// The button must not draw its own :focus-visible outline or the two stack
		// into a doubled ring over the trigger.
		outline: 'none'
	},
	triggerPlaceholder: {
		color: colorVars['--color-text-secondary']
	},
	triggerLabel: {
		flexGrow: 1,
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		textAlign: 'start'
	},
	triggerIcon: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 16,
		height: 16,
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		transformOrigin: 'center',
		color: colorVars['--color-icon-secondary']
	},
	triggerIconOpen: {
		transform: 'rotate(180deg)'
	},
	triggerIconStatus: {
		// Disable rotation transition for status icons
		transition: 'none'
	},
	triggerGhost: {
		width: 'auto',
		borderWidth: 0,
		backgroundColor: 'transparent',
		backgroundImage: {
			default: null,
			':hover': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			},
			':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`
		},
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within)': {
				'@media (hover: hover)': 'none'
			},
			':focus-within': 'none'
		},
		fontWeight: fontWeightVars['--font-weight-medium'],
		outline: {
			default: 'none',
			':has(:focus-visible)': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':has(:focus-visible)': '3px'
		},
		transitionProperty: 'background-image, background-color, color, opacity, transform',
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.98)'
		}
	},
	triggerGhostDisabled: {
		backgroundImage: 'none',
		transform: {
			default: 'none',
			':active': 'none'
		}
	},

	// Clear button
	clearButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-element'],
		outline: {
			default: 'none',
			':focus-visible': `${borderVars['--border-width']} solid ${colorVars['--color-accent']}`
		},
		outlineOffset: 1
	},
	statusButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		color: 'inherit',
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-element'],
		outline: {
			default: 'none',
			':focus-visible': `${borderVars['--border-width']} solid ${colorVars['--color-accent']}`
		},
		outlineOffset: 1
	},

	// Dropdown container
	dropdown: {
		boxSizing: 'border-box',
		maxHeight: '300px',
		overflowY: 'auto',
		padding: spacingVars['--spacing-1'],
		opacity: 1,
		transition: `opacity ${durationVars['--duration-fast']}`
	},
	dropdownHidden: {
		opacity: 0,
		transition: 'none'
	},

	// Popover container (for anchor positioning)
	popover: {
		minWidth: 'anchor-size(width)'
	},
	// Search field. The inner TextInput owns the border, focus ring, magnifier
	// (startIcon), and clear button (hasClear); this wrapper only supplies the
	// dropdown's inline/block padding around it.
	searchWrapper: {
		display: 'flex',
		alignItems: 'center',
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1']
	},

	// Empty state
	emptyState: {
		padding: spacingVars['--spacing-3'],
		textAlign: 'center',
		color: colorVars['--color-text-secondary'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size']
	},

	// Section divider with label
	sectionDivider: {
		marginBlock: spacingVars['--spacing-1']
	},

	// Divider
	divider: {
		marginBlock: spacingVars['--spacing-1']
	},

	// Individual item
	item: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		padding: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-element'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		border: 'none',
		cursor: 'pointer',
		textAlign: 'start',
		outline: 'none'
	},
	itemContent: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		flex: 1,
		minWidth: 0
	},
	itemCheckmark: {
		flexShrink: 0,
		width: 16,
		height: 16,
		color: colorVars['--color-icon-primary']
	},
	itemHighlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	itemSelected: {
		fontWeight: fontWeightVars['--font-weight-medium']
	},
	itemDisabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	}
});

const sizeStyles = stylex.create({
	sm: {
		height: sizeVars['--size-element-sm']
	},
	md: {
		height: sizeVars['--size-element-md']
	},
	lg: {
		height: sizeVars['--size-element-lg']
	}
});

/**
 * Size-specific overrides for dropdown list items.
 * Matches the pattern used by DropdownMenuItem so that
 * an `sm` selector renders compact list items, `md`/`lg` use
 * the base padding defined in `styles.item`.
 */
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

/** Published from `selector.svelte`, derived from the size style keys. */
export type SelectorSize = keyof typeof sizeStyles;

/**
 * Visual style of the selector trigger. Declared here rather than in
 * `selector.svelte` because `selectorTriggerContainerAttrs` needs it, the same
 * arrangement `ButtonVariant` takes; upstream declares it in `Selector.tsx`
 * beside the styles it gates.
 *
 * Deliberately absent from `src/lib/index.ts`: upstream's `Selector/index.ts`
 * publishes `SelectorProps`/`SelectorSize`/`SelectorStatus`/`SelectorStatusType`
 * and withholds `SelectorVariant`, so the barrel does too — the standing
 * `SelectorOptionProps` already has.
 */
export type SelectorVariant = 'input' | 'ghost';

/** The bordered surface wrapping the trigger button, spinner, clear and chevron. */
export function selectorTriggerContainerAttrs(
	size: SelectorSize,
	variant: SelectorVariant,
	statusType: InputStatusType | undefined,
	isDisabled: boolean,
	hasSelectedItem: boolean,
	inGroup: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.triggerContainer,
		sizeStyles[size],
		variant === 'ghost' && styles.triggerGhost,
		isDisabled && inputWrapperStyles.disabled,
		variant === 'ghost' && isDisabled && styles.triggerGhostDisabled,
		!hasSelectedItem && styles.triggerPlaceholder,
		variant !== 'ghost' && statusType && inputStatusBorderStyles[statusType],
		variant !== 'ghost' && statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		variant !== 'ghost' && inGroup && groupStyles.inGroup,
		xstyle
	);
}

/** The `role="combobox"` button itself. */
export function selectorTriggerAttrs(): SvelteStyleAttrs {
	return sx(styles.trigger);
}

/** The truncating label inside the trigger. */
export function selectorTriggerLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerLabel);
}

/**
 * The trailing chevron / status icon slot. `showStatusIcon` is the on-field
 * status affordance actually rendering — not merely `status != null`, since the
 * `detached` variant suppresses it and the chevron takes the slot back.
 */
export function selectorTriggerIconAttrs(
	showStatusIcon: boolean,
	isOpen: boolean
): SvelteStyleAttrs {
	return sx(
		styles.triggerIcon,
		!showStatusIcon && isOpen && styles.triggerIconOpen,
		showStatusIcon && styles.triggerIconStatus
	);
}

/** The inline clear button. */
export function selectorClearButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.clearButton);
}

/** The focusable status button that opens the `tooltip` variant's info-tip. */
export function selectorStatusButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.statusButton);
}

/** The scrolling `role="listbox"`, transparent until the overlay offset is measured. */
export function selectorDropdownAttrs(isPositioned: boolean): SvelteStyleAttrs {
	return sx(styles.dropdown, !isPositioned && styles.dropdownHidden);
}

/** The search field's padding wrapper. The field itself is a `TextInput`. */
export function selectorSearchWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.searchWrapper);
}

/** The "No results found" row. */
export function selectorEmptyStateAttrs(): SvelteStyleAttrs {
	return sx(styles.emptyState);
}

/** A single `role="option"` row. */
export function selectorItemAttrs(
	size: SelectorSize,
	isHighlighted: boolean,
	isSelected: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.item,
		itemSizeStyles[size],
		isHighlighted && styles.itemHighlighted,
		isSelected && styles.itemSelected,
		isDisabled && styles.itemDisabled
	);
}

/** The option's content span, holding the icon and label. */
export function selectorItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.itemContent);
}

/** `xstyle` for a plain divider between options. */
export const selectorDividerStyle: StyleArg = styles.divider;

/** `xstyle` for the labelled divider that titles a section. */
export const selectorSectionDividerStyle: StyleArg = styles.sectionDivider;

/**
 * `xstyle` for the layer container — upstream's `[styles.popover,
 * layerAnimations[placement]]`, whose second half the caller appends.
 */
export const selectorPopoverStyle: StyleArg = styles.popover;
