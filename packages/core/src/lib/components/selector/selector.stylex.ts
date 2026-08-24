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
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `Selector/Selector.tsx`, where the styles are inline in
 * the component file rather than in a module of their own. The group names
 * (`styles`/`sizeStyles`/`itemSizeStyles`) are upstream's, so none is renamed.
 *
 * `styles.itemCheckmark` is **dead upstream** — declared and never applied (the
 * selected mark is the `check` indicator), so `dist/` folds it away entirely and
 * neither oracle mode has a counterpart to diff it against. Ported for parity
 * anyway, the same standing `tab-menu.stylex.ts`'s identically-named key has. It
 * is the reverse of a skip, as `Collapsible`'s `triggerDisabled` is.
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
		// One text line, pinned: the trigger is sized by padding rather than by a
		// fixed height, so the line box has to be a known quantity. `Item`'s own
		// rows set their line heights and are unaffected.
		lineHeight: spacingVars['--spacing-5'],
		color: colorVars['--color-text-primary'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
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
	// Only what Icon does not already provide: `size="sm"` gives the 16px box
	// and `color` the token, but the glyph still must not shrink inside the flex
	// trigger.
	triggerIcon: {
		flexShrink: 0
	},
	// Rotation lives on the chevron glyph itself (passed through `xstyle`), not
	// on the layout wrapper above, so the icon's `selector-indicator-icon` theme
	// target and the open/closed transform sit on one element — a theme can
	// restyle the mark and its rotation through a single selector. The wrapper
	// keeps only layout. The status branch renders a different icon, so it never
	// picks these up and needs no transition opt-out.
	triggerIconRotation: {
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		transformOrigin: 'center'
	},
	triggerIconOpen: {
		transform: 'rotate(180deg)'
	},
	triggerGhost: {
		width: 'auto',
		borderWidth: 0,
		backgroundColor: 'transparent',
		backgroundImage: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			},
			':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`
		},
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within):where(:not(:disabled,[aria-disabled="true"]))': {
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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element']
	},

	// Dropdown container
	dropdown: {
		boxSizing: 'border-box',
		maxHeight: '300px',
		overflowY: 'auto',
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-1'],
		opacity: 1,
		transition: `opacity ${durationVars['--duration-fast']}`
	},
	dropdownInput: {
		// The input trigger's text inset includes its border. Mirror that extra
		// pixel in the menu; the borderless ghost variant needs no correction.
		paddingInline: `calc(${spacingVars['--spacing-1']} + ${borderVars['--border-width']})`
	},
	// Same correction for the search row's gutter, so the search field and the
	// option rows share one left edge.
	searchRowInput: {
		paddingInline: `calc(${spacingVars['--spacing-1']} + ${borderVars['--border-width']})`
	},
	dropdownHidden: {
		opacity: 0,
		transition: 'none'
	},

	// Popover container (for anchor positioning)
	popover: {
		minWidth: 'anchor-size(width)'
	},

	// Empty state
	emptyState: {
		padding: spacingVars['--spacing-3'],
		textAlign: 'center',
		color: colorVars['--color-text-secondary'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size']
	},

	// Section heading. Plain secondary text, no rules — the same treatment
	// DropdownMenu and CommandPaletteGroup already use for a group heading in a
	// panel list. A labelled Divider (line–text–line) reads as a separator, and
	// next to the search row's own divider it stacked two rules a few pixels
	// apart.
	sectionHeading: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		userSelect: 'none'
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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
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
	// The mark's column, reserved on every row and at either position, so a row
	// occupies the same geometry whether or not it is the chosen one — the
	// default check draws nothing when unchecked, and without the column a list
	// would indent (or truncate) its chosen row differently from the rest.
	// `minWidth` rather than `width`: a theme can replace `check` with a larger
	// indicator (a radio is 20px at `sm`), and the column has to grow with it.
	itemMarkColumn: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		minWidth: '1rem'
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
		cursor: 'default'
	},
	// Inside an `InputGroup` the group's own height is the row, and the trigger
	// takes it: `height: 100%` from `groupStyles.inGroup` can only govern if the
	// trigger stops asserting a floor of its own — otherwise a control sized above
	// its group (`<InputGroup size="md"><Selector size="lg">`) grows the row it was
	// supposed to sit in. The padding goes with it: the row is already the size
	// token, and the value box is centred in it.
	triggerInGroup: {
		minHeight: 0,
		paddingBlock: 0
	}
});

// The trigger is sized by PADDING, not by a fixed height, so it is the size
// token plus one text line for each extra line the value uses: 28/32/36 for one
// line, 48/52/56 for two. The token and a text line are both multiples of 4, so
// every trigger lands on the 4px rhythm and lines up with the Buttons and inputs
// beside it. No prop picks the height — the content does, and it can only land
// on the grid.
//
// `--spacing-5` is one line here because `triggerContainer` pins its line-height
// to exactly that; the two must stay in step, which is why both read the same
// token rather than one hardcoding 20px.
const linePad = (token: string) =>
	`calc((${token} - ${spacingVars['--spacing-5']} - 2 * ${borderVars['--border-width']}) / 2)`;

const sizeStyles = stylex.create({
	sm: {
		minHeight: sizeVars['--size-element-sm'],
		paddingBlock: linePad(sizeVars['--size-element-sm'])
	},
	md: {
		minHeight: sizeVars['--size-element-md'],
		paddingBlock: linePad(sizeVars['--size-element-md'])
	},
	lg: {
		minHeight: sizeVars['--size-element-lg'],
		paddingBlock: linePad(sizeVars['--size-element-lg'])
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
		// A ghost trigger has no bordered wrapper of its own, so the shared ring is
		// what makes its keyboard focus visible (#4935/#4973). `focusWithin` is
		// `:has(:focus-visible)`, so a pointer click does not draw it.
		variant === 'ghost' && focusOutlineStyles.focusWithin,
		isDisabled && inputWrapperStyles.disabled,
		variant === 'ghost' && isDisabled && styles.triggerGhostDisabled,
		!hasSelectedItem && styles.triggerPlaceholder,
		variant !== 'ghost' && statusType && inputStatusBorderStyles[statusType],
		variant !== 'ghost' && statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		variant !== 'ghost' && inGroup && groupStyles.inGroup,
		inGroup && styles.triggerInGroup,
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
 * `xstyle` for the on-field status glyph — the no-shrink rule alone. The status
 * branch renders a different icon from the chevron, so it never picks up the
 * rotation and needs no transition opt-out.
 */
export const selectorTriggerIconStyle: StyleArg = styles.triggerIcon;

/**
 * `xstyle` for the chevron glyph: the no-shrink rule, the rotation transition,
 * and the flip while open. Handed to `Icon` so one element carries the mark, its
 * transform and the `selector-indicator-icon` theme target.
 */
export function selectorChevronXstyle(isOpen: boolean): StyleArg {
	return [styles.triggerIcon, styles.triggerIconRotation, isOpen && styles.triggerIconOpen];
}

/** The focusable status button that opens the `tooltip` variant's info-tip. */
export function selectorStatusButtonAttrs(): SvelteStyleAttrs {
	return sx(focusOutlineStyles.focusVisible, styles.statusButton);
}

/**
 * The scrolling `role="listbox"`, transparent until the overlay offset is
 * measured. `dropdownInput` mirrors the bordered trigger's extra pixel of text
 * inset; the borderless ghost variant needs no correction.
 */
export function selectorDropdownAttrs(
	variant: SelectorVariant,
	isPositioned: boolean
): SvelteStyleAttrs {
	return sx(
		styles.dropdown,
		variant !== 'ghost' && styles.dropdownInput,
		!isPositioned && styles.dropdownHidden
	);
}

/**
 * `xstyle` for the `PanelSearchInput` row — the same one-pixel gutter correction
 * `dropdownInput` applies, so the search field and the option rows share one
 * left edge. Only for the bordered variant, as upstream gates it.
 */
export const selectorSearchRowStyle: StyleArg = styles.searchRowInput;

/** The "No results found" row. */
export function selectorEmptyStateAttrs(): SvelteStyleAttrs {
	return sx(styles.emptyState);
}

/** The `aria-hidden` heading inside a `role="group"`. */
export function selectorSectionHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.sectionHeading);
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

/** The reserved column the selection mark sits in, at either edge of the row. */
export function selectorItemMarkColumnAttrs(): SvelteStyleAttrs {
	return sx(styles.itemMarkColumn);
}

/** `xstyle` for a plain divider between options. */
export const selectorDividerStyle: StyleArg = styles.divider;

/**
 * `xstyle` for the layer container — upstream's `[styles.popover,
 * layerAnimations[placement]]`, whose second half the caller appends.
 */
export const selectorPopoverStyle: StyleArg = styles.popover;

/**
 * The system's standard menu clearance, passed to `<PopoverLayer offset>`
 * (#5003). A token cannot be read from a `.svelte` file, so it is re-exported
 * here — the arrangement `powerSearchPopoverOffset` settled. Not applied in
 * overlay mode: there the measured negative margin owns the block geometry and
 * the menu is meant to sit on the trigger, not clear it.
 */
export const selectorPopoverOffset: string = spacingVars['--spacing-1'];
