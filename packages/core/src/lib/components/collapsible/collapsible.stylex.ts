import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import type { CollapsibleGroupDensity } from './collapsible-group-context.svelte.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

const styles = stylex.create({
	root: {
		width: '100%'
	},
	trigger: {
		all: 'unset',
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-large-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-primary'],
		textAlign: 'start',
		paddingBlock: 0
		// `all: unset` wipes the UA focus outline; restore a keyboard-only ring.
	},
	// Capsize: trim leading from text triggers.
	triggerLabel: {
		textBoxEdge: 'cap alphabetic',
		textBoxTrim: 'trim-both'
	},
	// Disabled trigger — non-interactive, dimmed. `aria-disabled` (not native
	// `disabled`) blocks activation via the handler while staying perceivable.
	triggerDisabled: {
		cursor: 'default',
		opacity: 0.5
	},
	chevron: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		// The chevron is sized off the trigger's own type size (--text-large-size,
		// 17px), which sits between Icon's `sm` (16px) and `md` (20px) boxes.
		// Pinning the box to the token keeps the glyph exactly the size it was
		// when it was a bare 1em SVG inheriting the trigger's font-size, and keeps
		// it tracking the trigger if a theme retunes that step.
		width: typeScaleVars['--text-large-size'],
		height: typeScaleVars['--text-large-size'],
		fontSize: typeScaleVars['--text-large-size'],
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronOpen: {
		transform: 'rotate(180deg)'
	},
	chevronClosed: {
		transform: 'rotate(0deg)'
	},
	contentHidden: {
		display: 'none'
	},
	// Anchors body typography so revealed text renders at the system's body scale
	// instead of inheriting from wherever the Collapsible is placed.
	content: {
		paddingBlockStart: spacingVars['--spacing-1'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		fontWeight: typeScaleVars['--text-body-weight'],
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary']
	},
	// Group divider chrome — a hairline above every item except the first.
	divided: {
		borderBlockStartWidth: {
			default: borderVars['--border-width'],
			':first-child': '0'
		},
		borderBlockStartStyle: 'solid',
		borderBlockStartColor: colorVars['--color-border']
	}
});

// Density padding for divided/padded rows. Content only pads its end so text
// doesn't sit on the divider below (block-start stays spacing-1).
const densityStyles = stylex.create({
	triggerCompact: { paddingBlock: spacingVars['--spacing-1'] },
	triggerBalanced: { paddingBlock: spacingVars['--spacing-2'] },
	triggerSpacious: { paddingBlock: spacingVars['--spacing-3'] },
	contentCompact: { paddingBlockEnd: spacingVars['--spacing-1'] },
	contentBalanced: { paddingBlockEnd: spacingVars['--spacing-2'] },
	contentSpacious: { paddingBlockEnd: spacingVars['--spacing-3'] }
});

const triggerDensity = {
	compact: densityStyles.triggerCompact,
	balanced: densityStyles.triggerBalanced,
	spacious: densityStyles.triggerSpacious
} as const;

const contentDensity = {
	compact: densityStyles.contentCompact,
	balanced: densityStyles.contentBalanced,
	spacious: densityStyles.contentSpacious
} as const;

/** The root wrapper; `divided` adds the group hairline. `xstyle` is last. */
export function collapsibleRootAttrs(isDivided: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, isDivided && styles.divided, xstyle);
}

/** The trigger button, with optional density padding and disabled dimming. */
export function collapsibleTriggerAttrs(
	density: CollapsibleGroupDensity | null,
	isDisabled: boolean
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.trigger,
		density != null && triggerDensity[density],
		isDisabled && styles.triggerDisabled
	);
}

/** The capsized trigger label wrapper. */
export function collapsibleTriggerLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerLabel);
}

/**
 * The chevron indicator; rotates 180° when open. Passed to the `Icon`'s
 * `xstyle` the way upstream passes `styles.chevron` and the open/closed pair
 * (#4838), so the element a theme targets is the element that rotates. The
 * wrapper `<span>` it replaced carried `--color-icon-secondary`; the same token
 * now arrives as the Icon's `color="secondary"`.
 */
export const collapsibleChevronStyle = styles.chevron;
export const collapsibleChevronOpenStyle = styles.chevronOpen;
export const collapsibleChevronClosedStyle = styles.chevronClosed;

/** The content region, hidden when collapsed, with optional density padding. */
export function collapsibleContentAttrs(
	density: CollapsibleGroupDensity | null,
	isOpen: boolean
): SvelteStyleAttrs {
	return sx(
		styles.content,
		density != null && contentDensity[density],
		!isOpen && styles.contentHidden
	);
}
