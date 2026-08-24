import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { radiusVars, spacingVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/filtering/useTableFiltering.tsx`.
 *
 * The group name is upstream's (`filterStyles`) and every key keeps upstream's
 * spelling, so the class-parity oracle needs no rename entry. Each style is
 * exported through an `sx()`-wrapped attribute function because every call site
 * is a `.svelte` file, and StyleX may not be imported from one.
 */

const filterStyles = stylex.create({
	afterPopover: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0
	},
	afterInline: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-1'],
		marginTop: spacingVars['--spacing-1'],
		minWidth: 0
	},
	triggerButton: {
		background: 'none',
		border: 'none',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		borderRadius: radiusVars['--radius-element'],
		flexShrink: 0,
		// Minimum 44px touch target on coarse pointer devices (iOS guideline).
		'@media (pointer: coarse)': {
			minWidth: '44px',
			minHeight: '44px'
		}
	},
	triggerInactive: {
		opacity: {
			default: 0.35,
			':is(th:hover *)': 1,
			':focus-visible': 1
		}
	},
	triggerActive: {
		opacity: 1
	},
	popoverContent: {
		width: '240px'
	},
	popoverActions: {
		display: 'flex',
		gap: spacingVars['--spacing-2'],
		marginTop: spacingVars['--spacing-2']
	},
	popoverActionsSpacer: {
		flex: 1
	},
	placeholder: {
		height: '32px'
	},
	placeholderCompact: {
		height: '28px'
	}
});

/** Wrapper around the funnel trigger in the header cell's `after` slot. */
export function filterAfterPopoverAttrs(): SvelteStyleAttrs {
	return sx(filterStyles.afterPopover);
}

/** Wrapper around an inline filter control in the header cell's `below` slot. */
export function filterAfterInlineAttrs(): SvelteStyleAttrs {
	return sx(filterStyles.afterInline);
}

/** The funnel `<button>`. Dimmed until the column has a value, is hovered or focused. */
export function filterTriggerAttrs(hasValue: boolean): SvelteStyleAttrs {
	return sx(
		filterStyles.triggerButton,
		hasValue ? filterStyles.triggerActive : filterStyles.triggerInactive
	);
}

/** The popover's fixed-width content box. */
export function filterPopoverContentAttrs(): SvelteStyleAttrs {
	return sx(filterStyles.popoverContent);
}

/** The reset/apply action row beneath the popover's control. */
export function filterPopoverActionsAttrs(): SvelteStyleAttrs {
	return sx(filterStyles.popoverActions);
}

/** The flexible gap that pushes "Apply" to the end of the action row. */
export function filterPopoverActionsSpacerAttrs(): SvelteStyleAttrs {
	return sx(filterStyles.popoverActionsSpacer);
}

/**
 * Height-only spacer standing in for a filter control on a column that has
 * none, so inline header cells stay aligned across the row.
 */
export function filterPlaceholderAttrs(isCompact: boolean): SvelteStyleAttrs {
	return sx(isCompact ? filterStyles.placeholderCompact : filterStyles.placeholder);
}
