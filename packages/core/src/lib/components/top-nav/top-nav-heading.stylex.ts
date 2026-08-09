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
 * The `:has(.astryx-navicon)` selector on `paddingInlineStart` is what lets a
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
			':has(.astryx-navicon)': 0
		},
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlock: 0,
		boxSizing: 'border-box',
		textDecoration: 'none',
		color: colorVars['--color-text-primary'],
		cursor: 'default'
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
			':has(.astryx-navicon)': 0
		},
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlock: 0,
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-2'],
		marginInline: spacingVars['--spacing-1'],
		cursor: 'pointer'
	},
	popoverChevron: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: spacingVars['--spacing-7'],
		minHeight: spacingVars['--spacing-7'],
		color: colorVars['--color-icon-secondary'],
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

/** The static chevron shown when a menu exists but the whole block is the trigger. */
export function topNavHeadingChevronAttrs(): SvelteStyleAttrs {
	return sx(styles.chevron);
}

/** The chevron as its own focusable button, inside a heading that has links. */
export function topNavHeadingChevronButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.chevron, styles.interactive);
}

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

/** The replica's chevron, flipped to point back up at the trigger. */
export function topNavHeadingPopoverChevronAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverChevron);
}
