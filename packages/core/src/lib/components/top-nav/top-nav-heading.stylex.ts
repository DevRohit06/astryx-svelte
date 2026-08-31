import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNavHeading.tsx` styles.
 *
 * Near-identical to `SideNavHeading`'s, deliberately — the two headings are the
 * same product/suite/account block in two chromes, and upstream keeps them as
 * separate declarations rather than sharing a module. Kept separate here for the
 * same reason: the oracle diffs each against its own upstream file, and merging
 * them would make one of the two unverifiable.
 *
 * `styles.popover` is **declared and never applied**, on both sides — only
 * `popoverOverlap` reaches a `render` call. Ported verbatim: StyleX drops
 * unreferenced keys, so it emits nothing and the oracle has nothing to compare,
 * exactly as upstream's `dist/` does.
 *
 * The `:has(.astryx-nav-icon)` selector on `paddingInlineStart` is what lets a
 * `NavIcon` logo sit flush against the bar's edge while a bare image keeps its
 * inset — it reads the stable class `themeProps('navicon')` stamps. The key is
 * one of upstream's eight genuinely de-hyphenated target names, so the selector
 * only matches spelled exactly that way.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		minHeight: spacingVars['--spacing-8'],
		paddingInlineStart: {
			default: spacingVars['--spacing-2'],
			':has(.astryx-nav-icon)': 0
		},
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlock: 0,
		boxSizing: 'border-box',
		textDecoration: 'none',
		color: colorVars['--color-text-primary'],
		cursor: 'default'
	},
	interactive: {
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element'],
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: fontWeightVars['--font-weight-normal'],
		textAlign: 'start',
		':hover:where(:not(:disabled,[aria-disabled="true"]))': {
			'@media (hover: hover)': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		}
	},
	menuTrigger: {
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element'],
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: fontWeightVars['--font-weight-normal'],
		textAlign: 'start'
	},
	logo: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	textContainer: {
		display: 'flex',
		flexDirection: 'column',
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
		color: colorVars['--color-icon-secondary']
	},
	// The registry chevron is a 1em SVG, so it has always rendered at the
	// heading's inherited font size. Icon's size box would repin it to a fixed
	// rem (the nearest, sm, is 1rem = 16px vs the 14px base here), so hold the
	// glyph on the inherited em — the 28px chevron box above is unchanged, and
	// the glyph keeps tracking the surrounding text.
	chevronGlyph: {
		width: '1em',
		height: '1em',
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
			':has(.astryx-nav-icon)': 0
		},
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlock: 0,
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-2'],
		marginInline: spacingVars['--spacing-1'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	// Composes over `chevron` — the flipped popover copy differs only by the
	// rotation, so it carries just that.
	popoverChevron: {
		transform: 'rotate(180deg)'
	},
	// Declared upstream and applied nowhere — see the module comment.
	popover: {
		minWidth: 'anchor-size(width)',
		marginBlockStart: spacingVars['--spacing-1']
	},
	popoverOverlap: {
		minWidth: 'calc(anchor-size(width) + 16px)',
		marginBlockStart: 'calc(-1 * anchor-size(height) - 8px)',
		marginInlineStart: '-8px'
	}
});

/**
 * The popover overlap offset — widens and shifts the layer so the heading text
 * inside it lands on top of the inline heading it replaced.
 */
export const topNavHeadingPopoverOverlap = styles.popoverOverlap;

/** The heading root, static: no menu, no links. */
export function topNavHeadingRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The heading root when the whole block is a link or a popover trigger. */
export function topNavHeadingTriggerRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, styles.menuTrigger, xstyle);
}

/** The logo slot. */
export function topNavHeadingLogoAttrs(): SvelteStyleAttrs {
	return sx(styles.logo);
}

/** The superheading / heading / subheading column. */
export function topNavHeadingTextContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.textContainer);
}

/** The superheading line. */
export function topNavHeadingSuperheadingAttrs(): SvelteStyleAttrs {
	return sx(styles.superheading);
}

/** The heading line. */
export function topNavHeadingHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.heading);
}

/** The heading rendered as its own link, inside the mixed-mode row. */
export function topNavHeadingHeadingLinkAttrs(): SvelteStyleAttrs {
	return sx(styles.heading, styles.headingLink);
}

/** The subheading line. */
export function topNavHeadingSubheadingAttrs(): SvelteStyleAttrs {
	return sx(styles.subheading);
}

/** The row holding the heading and its inline chevron. */
export function topNavHeadingRowAttrs(): SvelteStyleAttrs {
	return sx(styles.headingRow);
}

/**
 * The static chevron, passed to the `Icon`'s `xstyle` the way upstream passes
 * `[styles.chevron, styles.chevronGlyph]` (#4838). The 28px box is the
 * hit/alignment box, so it stays on the glyph's own element rather than on a
 * wrapper it would then have to fill; `chevronGlyph` holds the glyph itself on
 * the inherited em so `Icon size="sm"` cannot repin it to 16px.
 */
export const topNavHeadingChevronStyle: StyleArg = [styles.chevron, styles.chevronGlyph];

/** The chevron as its own focusable button, inside a heading that has links. */
export function topNavHeadingChevronButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.chevron, styles.interactive);
}

/**
 * The glyph inside a chevron *trigger*. The `<button>` stays a button — it owns
 * the accessible name and the handlers — and keeps the 28px box and the colour,
 * so the `Icon` only has to avoid resizing itself.
 */
export const topNavHeadingChevronGlyphStyle: StyleArg = styles.chevronGlyph;

/** The trailing slot pushed to the end of the heading row. */
export function topNavHeadingEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.headerEndContent);
}

/** The `role="menu"` wrapper inside the popover. */
export function topNavHeadingPopoverContentAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverContent);
}

/** The heading replica at the top of the popover, which closes it on click. */
export function topNavHeadingPopoverHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverHeading);
}

/**
 * The replica's chevron, flipped to point back up at the trigger. `popoverChevron`
 * composes over the other two rather than restating them, which is upstream's
 * `[styles.chevron, styles.chevronGlyph, styles.popoverChevron]`.
 */
export const topNavHeadingPopoverChevronStyle: StyleArg = [
	styles.chevron,
	styles.chevronGlyph,
	styles.popoverChevron
];
