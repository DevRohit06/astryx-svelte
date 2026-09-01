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
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';

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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast-min'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	highlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	selected: {
		backgroundColor: colorVars['--color-accent-muted']
	},
	disabled: {
		cursor: 'default',
		pointerEvents: 'none'
	},
	disabledContent: {
		opacity: 0.5
	},
	invisibleButton: {
		all: 'unset',
		cursor: {
			default: 'inherit',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
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
		cursor: {
			default: 'inherit',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
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
	// `layout="inline"`: label and description share one line, so the row fits a
	// fixed-height host such as a Selector trigger inside an InputGroup.
	inlineContent: {
		flexDirection: 'row',
		// Centered, not baseline-aligned: two different font sizes on a shared
		// baseline make a line box taller than either line, which would push a
		// fixed-height host (a Selector trigger) a pixel off its size token.
		alignItems: 'center',
		columnGap: spacingVars['--spacing-1']
	},
	inlineLabel: {
		flexShrink: 0
	},
	// The description yields width first, so the label — the part that identifies
	// the item — is the last thing to ellipsize.
	inlineDescription: {
		flexShrink: 1,
		minWidth: 0
	},
	label: {
		// Falls back to the primary text token; a parent (e.g. a destructive menu
		// item) can recolor the label by setting --_item-label-color.
		color: `var(--_item-label-color, ${colorVars['--color-text-primary']})`,
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
		// Companion to --_item-label-color for the secondary line.
		color: `var(--_item-description-color, ${colorVars['--color-text-secondary']})`,
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
export type ItemLayout = 'stacked' | 'inline';
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
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		isInteractive && interactionOverlayStyles.backgroundColor,
		isInteractive && focusOutlineStyles.focusWithin,
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
	isString: boolean,
	isInline: boolean
): SvelteStyleAttrs {
	return sx(
		styles.label,
		isInline && styles.inlineLabel,
		truncateStyle(labelLines, isString, styles.labelSingleTruncate, styles.labelMultiTruncate),
		labelLines != null && labelLines > 1 && dynamicStyles.lineClamp(labelLines)
	);
}

/**
 * The description line, same truncation rules — except that an inline row is one
 * line by definition, so the description always ellipsizes there. A snippet
 * description cannot wrap the row open.
 */
export function itemDescriptionAttrs(
	descriptionLines: number | undefined,
	isString: boolean,
	isInline: boolean
): SvelteStyleAttrs {
	return sx(
		styles.description,
		isInline && styles.inlineDescription,
		truncateStyle(
			descriptionLines,
			isString || isInline,
			styles.descriptionSingleTruncate,
			styles.descriptionMultiTruncate
		),
		descriptionLines != null && descriptionLines > 1 && dynamicStyles.lineClamp(descriptionLines)
	);
}

/** The middle column when the item is static or has a parent role. */
export function itemContentAttrs(isDisabled: boolean, isInline: boolean): SvelteStyleAttrs {
	return sx(styles.content, isInline && styles.inlineContent, isDisabled && styles.disabledContent);
}

/** The invisible `<button>` filling the middle column. */
export function itemInvisibleButtonAttrs(isDisabled: boolean, isInline: boolean): SvelteStyleAttrs {
	return sx(
		styles.invisibleButton,
		isInline && styles.inlineContent,
		isDisabled && styles.disabledContent
	);
}

/** The invisible link filling the middle column. */
export function itemInvisibleAnchorAttrs(isDisabled: boolean, isInline: boolean): SvelteStyleAttrs {
	return sx(
		styles.invisibleAnchor,
		isInline && styles.inlineContent,
		isDisabled && styles.disabledContent
	);
}

/** The leading slot wrapper. */
export function itemStartContentAttrs(): SvelteStyleAttrs {
	return sx(styles.startContent);
}

/** The trailing slot wrapper. */
export function itemEndContentAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.endContent, isDisabled && styles.disabledContent);
}
