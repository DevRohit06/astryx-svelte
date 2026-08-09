import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars, radiusVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	dropdown: {
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
		opacity: 1,
		transitionProperty: 'opacity',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	popover: {
		minWidth: 'anchor-size(width)'
	},
	popoverBlockGap: {
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-1']
	},
	popoverInlineGap: {
		marginInlineStart: spacingVars['--spacing-1'],
		marginInlineEnd: spacingVars['--spacing-1']
	},
	popoverCustomWidth: (width: string | number) => ({
		minWidth: typeof width === 'number' ? `${width}px` : width
	})
});

/** The `role="menu"` popup container. `xstyle` threaded last so it overrides. */
export function dropdownMenuAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.dropdown, xstyle);
}

/**
 * The layer `xstyle` array upstream builds:
 * `[popoverXstyle, popoverGapStyle, layerAnimations[placement]]`. Returned raw so
 * the caller can append `layerAnimations[placement]` and hand it to `<PopoverLayer>`.
 */
export function dropdownPopoverWidthStyle(menuWidth: number | string | undefined): StyleArg {
	// Truthy, matching upstream — a falsy `menuWidth` (0 / '') falls back to anchor-size.
	return menuWidth ? styles.popoverCustomWidth(menuWidth) : styles.popover;
}

/** The block/inline margin that offsets the popover from its anchor. */
export function dropdownPopoverGapStyle(isBlockAxis: boolean): StyleArg {
	return isBlockAxis ? styles.popoverBlockGap : styles.popoverInlineGap;
}
