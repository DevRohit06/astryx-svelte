import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Item/Item.tsx`.
 *
 * The universal "start content + label + description + end content" row. The
 * interactive variants do not overlay an absolutely-positioned hit target —
 * the label/description column *is* the button or anchor (`flex: 1`, `all:
 * unset`), sitting inline between the marker/start content and the end content,
 * with the row's `:has(:focus-visible)` outline painting when it takes focus.
 */

const styles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		position: 'relative',
		boxSizing: 'border-box',
		textAlign: 'start',
		borderRadius: radiusVars['--radius-element']
	},
	alignStart: {
		alignItems: 'flex-start'
	},
	interactive: {
		cursor: 'pointer',
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast-min'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: {
			default: 'transparent',
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			},
			':active': colorVars['--color-overlay-pressed']
		}
	},
	focusVisibleOutline: {
		outline: {
			default: 'none',
			':has(:focus-visible)': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':has(:focus-visible)': '2px'
		}
	},
	highlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	selected: {
		backgroundColor: colorVars['--color-accent-muted']
	},
	disabled: {
		cursor: 'not-allowed',
		pointerEvents: 'none'
	},
	disabledContent: {
		opacity: 0.5
	},
	invisibleButton: {
		all: 'unset',
		cursor: 'inherit',
		font: 'inherit',
		color: 'inherit',
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0,
		textAlign: 'start',
		outline: 'none'
	},
	invisibleAnchor: {
		all: 'unset',
		cursor: 'inherit',
		font: 'inherit',
		color: 'inherit',
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0,
		textAlign: 'start',
		textDecoration: 'none',
		outline: 'none'
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0,
		textAlign: 'start'
	},
	label: {
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading']
	},
	labelSingleTruncate: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	labelMultiTruncate: {
		overflow: 'hidden',
		display: '-webkit-box',
		WebkitBoxOrient: 'vertical'
	},
	description: {
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading']
	},
	descriptionSingleTruncate: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	descriptionMultiTruncate: {
		overflow: 'hidden',
		display: '-webkit-box',
		WebkitBoxOrient: 'vertical'
	},
	startContent: {
		flex: '0 0 auto',
		display: 'flex'
	},
	endContent: {
		flex: '0 0 auto',
		display: 'flex',
		marginInlineStart: 'auto'
	}
});

const dynamicStyles = stylex.create({
	lineClamp: (lines: number) => ({
		WebkitLineClamp: lines
	})
});

const densityStyles = stylex.create({
	compact: {
		paddingBlock: spacingVars['--spacing-1']
	},
	balanced: {
		paddingBlock: spacingVars['--spacing-2']
	},
	spacious: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-3']
	}
});

export type ItemAlign = 'center' | 'start';
export type ItemDensity = keyof typeof densityStyles;

/** Flags that pick the root's conditional styles. */
export interface ItemRootFlags {
	isInteractive: boolean;
	isHighlighted: boolean;
	isSelected: boolean;
	isDisabled: boolean;
	/** A caller-provided `role` means a parent handles keyboard — skip the disabled dim. */
	hasParentRole: boolean;
}

/** The item row. */
export function itemRootAttrs(
	density: ItemDensity,
	align: ItemAlign,
	{ isInteractive, isHighlighted, isSelected, isDisabled, hasParentRole }: ItemRootFlags,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.root,
		densityStyles[density],
		align === 'start' && styles.alignStart,
		isInteractive && styles.interactive,
		isInteractive && styles.focusVisibleOutline,
		isHighlighted && styles.highlighted,
		isSelected && styles.selected,
		isDisabled && !hasParentRole && styles.disabled,
		xstyle
	);
}

function truncateStyle(
	lines: number | undefined,
	isString: boolean,
	single: StyleArg,
	multi: StyleArg
): StyleArg {
	if (lines != null) {
		return lines === 1 ? single : multi;
	}
	return isString ? single : null;
}

/** The label line, with truncation driven by `labelLines` or a string label. */
export function itemLabelAttrs(
	labelLines: number | undefined,
	isString: boolean
): SvelteStyleAttrs {
	return sx(
		styles.label,
		truncateStyle(labelLines, isString, styles.labelSingleTruncate, styles.labelMultiTruncate),
		labelLines != null && labelLines > 1 && dynamicStyles.lineClamp(labelLines)
	);
}

/** The description line, same truncation rules. */
export function itemDescriptionAttrs(
	descriptionLines: number | undefined,
	isString: boolean
): SvelteStyleAttrs {
	return sx(
		styles.description,
		truncateStyle(
			descriptionLines,
			isString,
			styles.descriptionSingleTruncate,
			styles.descriptionMultiTruncate
		),
		descriptionLines != null && descriptionLines > 1 && dynamicStyles.lineClamp(descriptionLines)
	);
}

/** The middle column when the item is static or has a parent role. */
export function itemContentAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.content, isDisabled && styles.disabledContent);
}

/** The invisible `<button>` filling the middle column. */
export function itemInvisibleButtonAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.invisibleButton, isDisabled && styles.disabledContent);
}

/** The invisible link filling the middle column. */
export function itemInvisibleAnchorAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.invisibleAnchor, isDisabled && styles.disabledContent);
}

/** The leading slot wrapper. */
export function itemStartContentAttrs(): SvelteStyleAttrs {
	return sx(styles.startContent);
}

/** The trailing slot wrapper. */
export function itemEndContentAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.endContent, isDisabled && styles.disabledContent);
}
