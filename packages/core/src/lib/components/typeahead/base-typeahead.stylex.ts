import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Typeahead/BaseTypeahead.tsx`, where the styles are
 * declared inline in the component file under the group names
 * `styles`/`itemSizeStyles`, so neither needs a rename.
 */

const styles = stylex.create({
	input: {
		display: 'block',
		flex: 1,
		minWidth: '60px',
		borderWidth: 0,
		borderStyle: 'none',
		padding: 0,
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		outline: 'none',
		'::placeholder': {
			color: colorVars['--color-text-secondary']
		}
	},
	inputDisabled: {
		cursor: 'default'
	},
	dropdown: {
		boxSizing: 'border-box',
		maxHeight: '300px',
		overflowY: 'auto',
		padding: spacingVars['--spacing-1']
	},
	popover: {
		minWidth: 'anchor-size(width)'
	},
	popoverGap: {
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-1']
	},
	// `menuWidth` — a fixed pixel width for the dropdown. It rides beside
	// `popover`'s `min-width: anchor-size(width)` rather than replacing it, which
	// is what upstream's "never shrinks below the anchor width" means: the floor
	// wins whenever the anchor is wider than the number asked for.
	popoverCustomWidth: (width: number) => ({
		width: `${width}px`
	}),
	groupHeading: {
		paddingInline: spacingVars['--spacing-2'],
		paddingBlockStart: spacingVars['--spacing-2'],
		paddingBlockEnd: spacingVars['--spacing-1'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		userSelect: 'none'
	},
	item: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		width: '100%',
		padding: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-element'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		outline: 'none',
		backgroundColor: 'transparent',
		border: 'none',
		textAlign: 'start'
	},
	itemHighlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	itemSelected: {
		fontWeight: fontWeightVars['--font-weight-medium']
	},
	itemContent: {
		display: 'flex',
		flex: 1,
		minWidth: 0
	},
	emptyState: {
		padding: spacingVars['--spacing-3'],
		textAlign: 'center',
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary']
	},
	loadingSpinner: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacingVars['--spacing-1']
	}
});

/**
 * Size-specific overrides for dropdown list items.
 * Matches the pattern used by DropdownMenuItem / Selector so that
 * an `sm` typeahead renders compact list items.
 */
const itemSizeStyles = stylex.create({
	sm: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2']
	},
	md: {
		paddingBlock: spacingVars['--spacing-1-5']
	},
	lg: {
		paddingBlock: spacingVars['--spacing-2']
	}
});

/** The three sizes the dropdown rows scale to. Upstream inlines the union. */
export type BaseTypeaheadSize = keyof typeof itemSizeStyles;

/**
 * The `role="combobox"` `<input>`. `inputXStyle` is the wrapper component's
 * override (`Typeahead` passes its hidden-input style through it); `xstyle` is
 * the consumer's, threaded last as everywhere else — upstream declares it on
 * `BaseTypeaheadProps` (via `BaseProps`) and then drops it, the same
 * contradiction `HoverCard` records.
 */
export function baseTypeaheadInputAttrs(
	isDisabled: boolean,
	inputXStyle: StyleArg,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled, inputXStyle, xstyle);
}

/** The in-flight search indicator beside the input. */
export function baseTypeaheadLoadingSpinnerAttrs(): SvelteStyleAttrs {
	return sx(styles.loadingSpinner);
}

/** The scrolling `role="listbox"`. */
export function baseTypeaheadDropdownAttrs(): SvelteStyleAttrs {
	return sx(styles.dropdown);
}

/** A single `role="option"` row. */
export function baseTypeaheadItemAttrs(
	size: BaseTypeaheadSize,
	isHighlighted: boolean,
	isSelected: boolean
): SvelteStyleAttrs {
	return sx(
		styles.item,
		itemSizeStyles[size],
		isHighlighted && styles.itemHighlighted,
		isSelected && styles.itemSelected
	);
}

/**
 * The `aria-hidden` label above a named option group. New at 0.5.0 with the
 * grouped dropdown; the group's accessible name comes from the wrapper's
 * `aria-label`, so this row is decoration.
 */
export function baseTypeaheadGroupHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.groupHeading);
}

/** The option's content span. */
export function baseTypeaheadItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.itemContent);
}

/** The "No results found" row. */
export function baseTypeaheadEmptyStateAttrs(): SvelteStyleAttrs {
	return sx(styles.emptyState);
}

/**
 * `xstyle` for the layer container, handed to the layer as one array — the shape
 * upstream passes to `render`. `menuWidth` joined it at 0.5.0; it is a
 * `stylex.create` **function style**, so the class oracle cannot see it and only
 * the CSS oracle covers what it emits.
 */
export function baseTypeaheadPopoverStyle(menuWidth?: number): StyleArg {
	return [
		styles.popover,
		styles.popoverGap,
		menuWidth != null && styles.popoverCustomWidth(menuWidth)
	];
}
