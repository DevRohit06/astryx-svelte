import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from the `styles` block in Astryx's `Chat/useTriggerMenu.tsx`.
 *
 * `border: 'none'` on `item` is upstream's and is kept verbatim even though
 * StyleX silently drops the shorthand and emits no rule — `reset.css`'s
 * universal `border-width: 0; border-style: solid` is what actually clears it,
 * on both sides. Removing the declaration would make our source disagree with
 * upstream's for no change in output.
 */
const styles = stylex.create({
	dropdown: {
		boxSizing: 'border-box',
		maxHeight: '240px',
		overflowY: 'auto',
		padding: spacingVars['--spacing-1'],
		minWidth: '180px'
	},
	popoverSurface: {
		minWidth: '180px'
	},
	popoverGap: {
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-1']
	},
	item: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		width: '100%',
		padding: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-element'],
		cursor: 'pointer',
		outline: 'none',
		backgroundColor: 'transparent',
		border: 'none',
		textAlign: 'start' as const,
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary']
	},
	itemHighlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	itemLabel: {
		flex: 1,
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	emptyState: {
		padding: spacingVars['--spacing-3'],
		textAlign: 'center' as const,
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary']
	},
	loadingState: {
		padding: spacingVars['--spacing-3'],
		textAlign: 'center' as const,
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary']
	},
	groupHeading: {
		paddingInline: spacingVars['--spacing-2'],
		paddingBlockStart: spacingVars['--spacing-2'],
		paddingBlockEnd: spacingVars['--spacing-1'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		userSelect: 'none'
	}
});

export function triggerMenuDropdownAttrs(): SvelteStyleAttrs {
	return sx(styles.dropdown);
}

export function triggerMenuItemAttrs(isHighlighted: boolean): SvelteStyleAttrs {
	return sx(styles.item, isHighlighted && styles.itemHighlighted);
}

export function triggerMenuItemLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.itemLabel);
}

export function triggerMenuEmptyStateAttrs(): SvelteStyleAttrs {
	return sx(styles.emptyState);
}

export function triggerMenuLoadingStateAttrs(): SvelteStyleAttrs {
	return sx(styles.loadingState);
}

export function triggerMenuGroupHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.groupHeading);
}

/** The `xstyle` upstream hands to `popover.render` for the positioned surface. */
export const triggerMenuPopoverStyle: StyleArg[] = [styles.popoverSurface, styles.popoverGap];
