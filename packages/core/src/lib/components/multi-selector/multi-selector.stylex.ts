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
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `MultiSelector/MultiSelector.tsx`, where the styles are
 * inline in the component file rather than in a module of their own. The four
 * group names (`styles`/`sizeStyles`/`itemSizeStyles`/`selectAllSizeStyles`) are
 * upstream's, so none is renamed.
 *
 * Deliberately *not* shared with `selector.stylex.ts`: the two declare a dozen
 * identically-named keys, but they are separate `stylex.create` calls upstream
 * and several differ (`MultiSelector`'s `triggerContainer` has no coarse-pointer
 * font-size bump, its `popover` carries a `marginBlockStart`, its `item` has no
 * `justifyContent`/typography). Folding them together would be an invention.
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
		fontSize: typeScaleVars['--text-label-size'],
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
		// :focus-within when this button is focused, matching
		// TextInput/NumberInput/Selector. The button must not draw its own
		// :focus-visible outline or the two stack into a doubled ring over the
		// trigger.
		outline: 'none',
		borderRadius: radiusVars['--radius-element']
	},
	triggerPlaceholder: {
		color: colorVars['--color-text-secondary']
	},
	triggerContent: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 0,
		overflow: 'hidden'
	},
	triggerText: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	triggerBadges: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-1'],
		alignItems: 'center'
	},
	triggerOverflow: {
		flexShrink: 0,
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-secondary'],
		fontWeight: fontWeightVars['--font-weight-medium']
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
		borderRadius: radiusVars['--radius-element']
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
		borderRadius: radiusVars['--radius-element']
	},

	// Dropdown container
	dropdown: {
		boxSizing: 'border-box',
		maxHeight: '300px',
		overflowY: 'auto',
		padding: spacingVars['--spacing-1']
	},

	// Popover container (for anchor positioning)
	popover: {
		minWidth: 'anchor-size(width)',
		marginBlockStart: spacingVars['--spacing-1']
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

	// Select-all wrapper
	selectAllWrapper: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		cursor: 'pointer'
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
		gap: spacingVars['--spacing-2'],
		width: '100%',
		borderRadius: radiusVars['--radius-element'],
		cursor: 'pointer',
		backgroundColor: 'transparent',
		border: 'none',
		outline: 'none'
	},
	itemHighlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	itemDisabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	},

	// Decorative checkbox (non-interactive, purely visual)
	checkboxDecorative: {
		pointerEvents: 'none',
		display: 'flex',
		flexShrink: 0
	},

	// Label text for items (rendered outside checkbox for correct click behavior)
	itemLabel: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-primary'],
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	itemLabelDisabled: {
		color: colorVars['--color-text-disabled']
	},

	// Empty state
	emptyState: {
		padding: spacingVars['--spacing-3'],
		textAlign: 'center',
		color: colorVars['--color-text-secondary'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size']
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

const itemSizeStyles = stylex.create({
	sm: {
		padding: spacingVars['--spacing-1']
	},
	md: {
		paddingBlock: spacingVars['--spacing-1-5'],
		paddingInline: spacingVars['--spacing-2']
	},
	lg: {
		padding: spacingVars['--spacing-2']
	}
});

const selectAllSizeStyles = stylex.create({
	sm: {
		paddingInline: spacingVars['--spacing-1'],
		paddingBlock: spacingVars['--spacing-0-5']
	},
	md: {
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1']
	},
	lg: {
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1']
	}
});

/** Published from `multi-selector.svelte`, derived from the size style keys. */
export type MultiSelectorSize = keyof typeof sizeStyles;

/**
 * Visual style of the trigger. Declared here rather than in
 * `multi-selector.svelte` because `multiSelectorTriggerContainerAttrs` needs it,
 * the same arrangement `ButtonVariant` takes; upstream declares it in
 * `MultiSelector.tsx` beside the styles it gates.
 *
 * Deliberately absent from `src/lib/index.ts`: upstream's
 * `MultiSelector/index.ts` publishes `MultiSelectorProps`/`MultiSelectorSize`/
 * `MultiSelectorStatusType` and withholds `MultiSelectorVariant`, so the barrel
 * does too.
 */
export type MultiSelectorVariant = 'input' | 'ghost';

/** The bordered surface wrapping the trigger button, spinner, clear and chevron. */
export function multiSelectorTriggerContainerAttrs(
	size: MultiSelectorSize,
	variant: MultiSelectorVariant,
	statusType: InputStatusType | undefined,
	isDisabled: boolean,
	isEmpty: boolean,
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
		isEmpty && styles.triggerPlaceholder,
		variant !== 'ghost' && statusType && inputStatusBorderStyles[statusType],
		variant !== 'ghost' && statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		variant !== 'ghost' && inGroup && groupStyles.inGroup,
		xstyle
	);
}

/** The combobox button itself (a plain button in `hasSearch` mode). */
export function multiSelectorTriggerAttrs(): SvelteStyleAttrs {
	return sx(styles.trigger);
}

/** The span inside the trigger that holds the display content. */
export function multiSelectorTriggerContentAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerContent);
}

/** The truncating text for the `count`/`labels` displays and the placeholder. */
export function multiSelectorTriggerTextAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerText);
}

/** The wrapping row of badges for the `badges` display. */
export function multiSelectorTriggerBadgesAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerBadges);
}

/** The trailing `+N` count beside the badges. */
export function multiSelectorTriggerOverflowAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerOverflow);
}

/**
 * The trailing chevron / status icon slot. `showStatusIcon` is the on-field
 * status affordance actually rendering — not merely `status != null`, since the
 * `detached` variant suppresses it and the chevron takes the slot back.
 */
export function multiSelectorTriggerIconAttrs(
	showStatusIcon: boolean,
	isOpen: boolean
): SvelteStyleAttrs {
	return sx(
		styles.triggerIcon,
		!showStatusIcon && isOpen && styles.triggerIconOpen,
		showStatusIcon && styles.triggerIconStatus
	);
}

/** The inline clear-all button. */
export function multiSelectorClearButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.clearButton);
}

/** The focusable status button that opens the `tooltip` variant's info-tip. */
export function multiSelectorStatusButtonAttrs(): SvelteStyleAttrs {
	return sx(focusOutlineStyles.focusVisible, styles.statusButton);
}

/** The scrolling dropdown surface holding the search input and the listbox. */
export function multiSelectorDropdownAttrs(): SvelteStyleAttrs {
	return sx(styles.dropdown);
}

/** The search field's padding wrapper. The field itself is a `TextInput`. */
export function multiSelectorSearchWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.searchWrapper);
}

/**
 * A single `role="option"` row. The select-all row takes its own size ramp and
 * the `selectAllWrapper` layout, as upstream's conditional does.
 */
export function multiSelectorItemAttrs(
	size: MultiSelectorSize,
	isSelectAll: boolean,
	isHighlighted: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.item,
		isSelectAll ? selectAllSizeStyles[size] : itemSizeStyles[size],
		isSelectAll && styles.selectAllWrapper,
		isHighlighted && styles.itemHighlighted,
		isDisabled && styles.itemDisabled
	);
}

/** The `inert` wrapper around the purely visual checkbox. */
export function multiSelectorCheckboxDecorativeAttrs(): SvelteStyleAttrs {
	return sx(styles.checkboxDecorative);
}

/** The option's label text, rendered outside the checkbox. */
export function multiSelectorItemLabelAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.itemLabel, isDisabled && styles.itemLabelDisabled);
}

/** The "No results found" row. */
export function multiSelectorEmptyStateAttrs(): SvelteStyleAttrs {
	return sx(styles.emptyState);
}

/** `xstyle` for a plain divider between options (and under select-all). */
export const multiSelectorDividerStyle: StyleArg = styles.divider;

/** `xstyle` for the labelled divider that titles a section. */
export const multiSelectorSectionDividerStyle: StyleArg = styles.sectionDivider;

/**
 * `xstyle` for the layer container — upstream's `styles.popover`, to which the
 * caller appends `layerAnimations[placement]`.
 */
export const multiSelectorPopoverStyle: StyleArg = styles.popover;
