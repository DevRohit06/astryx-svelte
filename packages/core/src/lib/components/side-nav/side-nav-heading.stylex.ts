import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { navItemStyles } from '../nav-item/nav-item.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNavHeading.tsx` styles.
 *
 * The sidebar twin of `TopNavHeading`'s styles — upstream keeps the two as
 * separate declarations rather than sharing a module, and so does this port: the
 * oracle diffs each against its own upstream file, and merging them would leave
 * one unverifiable. They are not quite identical either; this one adds
 * `rootCollapsed` and `headingCompact`, and its `root` inherits `color` where
 * `TopNavHeading`'s names the primary token.
 *
 * `interactiveCollapsed` is declared upstream and applied nowhere. Ported for
 * shape parity; StyleX drops unreferenced keys, so it emits nothing on either
 * side.
 *
 * `menuTrigger` is `interactive` without the hover background: in a heading that
 * opens a menu, only `cursor: pointer` signals interactivity, because the
 * popover itself supplies the affordance.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		minHeight: spacingVars['--spacing-8'],
		paddingInlineStart: {
			default: spacingVars['--spacing-2'],
			':has(.astryx-navicon)': 0
		},
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlock: 0,
		boxSizing: 'border-box',
		textDecoration: 'none',
		color: 'inherit',
		cursor: 'default'
	},
	rootCollapsed: {
		justifyContent: 'center',
		paddingInline: 0
	},
	interactive: {
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-element'],
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: fontWeightVars['--font-weight-normal'],
		textAlign: 'start',
		':hover': {
			'@media (hover: hover)': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		}
	},
	// Menu trigger: like interactive but no hover background.
	// Only cursor:pointer signals interactivity; the popover provides context.
	menuTrigger: {
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-element'],
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: fontWeightVars['--font-weight-normal'],
		textAlign: 'start'
	},
	interactiveCollapsed: {
		backgroundColor: {
			default: 'transparent',
			':hover': {
				'@media (hover: hover)': 'transparent'
			}
		}
	},
	icon: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	textContainer: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0
	},
	superheading: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		textDecoration: 'none',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	heading: {
		fontSize: typeScaleVars['--text-large-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-large-leading'],
		color: colorVars['--color-text-primary'],
		textDecoration: 'none',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	// When super/sub headings are present, keep same size but allow compact layout
	headingCompact: {
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	subheading: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		textDecoration: 'none',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	headingRow: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	headingLink: {
		textDecoration: 'none',
		color: 'inherit',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	chevron: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: spacingVars['--spacing-7'],
		minHeight: spacingVars['--spacing-7'],
		color: colorVars['--color-icon-secondary'],
		// 28px is the hit/alignment box, not the glyph. Icon sizes its own span
		// with a matching font-size (the registry chevron is a 1em SVG), so pin
		// font-size back to inherit to keep the glyph at the 14px it renders at
		// today. The 28px min box still wins over Icon's width/height.
		fontSize: 'inherit'
	},
	headerEndContent: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		marginInlineStart: 'auto'
	},
	popoverContent: {
		padding: spacingVars['--spacing-1'],
		overflow: 'hidden'
	},
	// Static heading replica inside the popover — matches inline heading layout.
	// Clickable to close the popover.
	popoverHeading: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		border: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		color: 'inherit',
		textAlign: 'start',
		minHeight: spacingVars['--spacing-8'],
		paddingInlineStart: {
			default: spacingVars['--spacing-2'],
			':has(.astryx-navicon)': 0
		},
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlock: 0,
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-2'],
		marginInline: spacingVars['--spacing-1'],
		cursor: 'pointer'
	},
	// Chevron inside the popover heading — same as chevron but rotated up
	popoverChevron: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: spacingVars['--spacing-7'],
		minHeight: spacingVars['--spacing-7'],
		color: colorVars['--color-icon-secondary'],
		// See `chevron` — keep the glyph on the inherited font-size.
		fontSize: 'inherit',
		transform: 'rotate(180deg)'
	},
	// Glyph inside a chevron *trigger* (the button already carries the 28px box
	// and the color, so the Icon only has to avoid resizing itself).
	chevronGlyph: {
		fontSize: 'inherit'
	},
	popover: {
		minWidth: 'anchor-size(width)',
		marginBlockStart: spacingVars['--spacing-1']
	},
	// Overlap variant: popover covers the trigger so heading appears "in place".
	// Add 4px padding inside, then widen and shift to compensate so the
	// heading text inside the popover still aligns with the inline heading.
	popoverOverlap: {
		minWidth: 'calc(anchor-size(width) + 16px)',
		marginBlockStart: 'calc(-1 * anchor-size(height) - 8px)',
		marginInlineStart: '-8px'
	}
});

/** The layer offset used by the collapsed icon-only menu — sits below the trigger. */
export const sideNavHeadingPopover = styles.popover;

/** The layer offset used by the expanded menu — covers the trigger in place. */
export const sideNavHeadingPopoverOverlap = styles.popoverOverlap;

/** The heading root, static. */
export function sideNavHeadingRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The heading root when the whole block is a link or a popover trigger. */
export function sideNavHeadingTriggerRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.root, styles.menuTrigger, xstyle);
}

/** The collapsed static heading — centred, unpadded. */
export function sideNavHeadingCollapsedRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, styles.rootCollapsed, xstyle);
}

/** The collapsed heading as a link — the shared nav item, centred. */
export function sideNavHeadingCollapsedLinkAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(navItemStyles.item, styles.rootCollapsed, xstyle);
}

/** The collapsed heading as a menu trigger. */
export function sideNavHeadingCollapsedTriggerAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		navItemStyles.item,
		styles.rootCollapsed,
		styles.menuTrigger,
		xstyle
	);
}

/**
 * The icon slot when it is a link — a separate tab stop, so it rings. The plain
 * `sideNavHeadingIconAttrs` span below is not focusable and must not.
 */
export function sideNavHeadingIconLinkAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.icon);
}

/** The icon slot. */
export function sideNavHeadingIconAttrs(): SvelteStyleAttrs {
	return sx(styles.icon);
}

/** The superheading / heading / subheading column. */
export function sideNavHeadingTextContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.textContainer);
}

/** The superheading line. */
export function sideNavHeadingSuperheadingAttrs(): SvelteStyleAttrs {
	return sx(styles.superheading);
}

/** The heading line, optionally compacted when a super/subheading sits beside it. */
export function sideNavHeadingHeadingAttrs(isCompact = false): SvelteStyleAttrs {
	return sx(styles.heading, isCompact && styles.headingCompact);
}

/** The heading rendered as its own link, inside the mixed-mode row. */
export function sideNavHeadingHeadingLinkAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.heading, styles.headingLink);
}

/** The subheading line. */
export function sideNavHeadingSubheadingAttrs(): SvelteStyleAttrs {
	return sx(styles.subheading);
}

/** The row holding the heading and its inline chevron. */
export function sideNavHeadingRowAttrs(): SvelteStyleAttrs {
	return sx(styles.headingRow);
}

/**
 * The static chevron, passed to the `Icon`'s `xstyle` the way upstream passes
 * `styles.chevron` (#4838). The 28px box is the hit/alignment box, so it stays
 * on the glyph's own element rather than a wrapper it would have to fill.
 */
export const sideNavHeadingChevronStyle = styles.chevron;

/** The chevron as its own focusable button, inside a heading that has links. */
export function sideNavHeadingChevronButtonAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.chevron, styles.interactive);
}

/**
 * The glyph inside a chevron *trigger*. The `<button>` stays a button and keeps
 * the 28px box and the colour; the `Icon` only has to avoid resizing itself.
 */
export const sideNavHeadingChevronGlyphStyle = styles.chevronGlyph;

/** The trailing slot pushed to the end of the heading row. */
export function sideNavHeadingEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.headerEndContent);
}

/** The `role="menu"` wrapper inside the popover. */
export function sideNavHeadingPopoverContentAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverContent);
}

/** The heading replica at the top of the popover, which closes it on click. */
export function sideNavHeadingPopoverHeadingAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.popoverHeading);
}

/** The replica's chevron, flipped to point back up at the trigger. */
export const sideNavHeadingPopoverChevronStyle = styles.popoverChevron;
