import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { Elevation } from '../../internal/types.js';
import { edgeCompSlot } from '../../internal/edge-compensation.stylex.js';
import {
	borderVars,
	colorVars,
	shadowVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Banner/Banner.tsx` styles.
 *
 * The root, header and end area survive into upstream's `dist/` as objects —
 * each reaches `stylex.props` beside a conditional, an `xstyle` spread or a
 * dynamic `edgeCompSlot.inset`. The chevron pair joins them, since 0.4.1 hands
 * it to the `Icon`'s `xstyle` (#4838). The text slots, the icon wrapper and the
 * content area are single call sites and were folded into literal class strings.
 */

/** Status controlling the banner's icon and colour. */
export interface BannerStatusMap {
	info: true;
	warning: true;
	error: true;
	success: true;
}

export type BannerStatus = keyof BannerStatusMap;

/**
 * Container type of the banner.
 * - `card`: standalone card with border-radius
 * - `section`: full-width section banner (no border-radius)
 */
export interface BannerContainerMap {
	card: true;
	section: true;
}

export type BannerContainer = keyof BannerContainerMap;

const styles = stylex.create({
	// Root container — layout only, no visual styling
	root: {
		display: 'flex',
		flexDirection: 'column',
		fontFamily: 'inherit'
	},
	// An elevated `card` banner rounds its root so the shadow follows the card
	// silhouette; the full-width `section` container stays square.
	rootElevatedCard: {
		borderRadius: `var(--_banner-radius, ${radiusVars['--radius-container']})`
	},
	// Header area — colored status background with icon, title, description, actions
	header: {
		display: 'flex',
		alignItems: 'flex-start',
		flexWrap: 'wrap',
		columnGap: spacingVars['--spacing-2'],
		// The end area carries a -4px block margin (see endArea), so the wrapped
		// row reads as one step of spacing rather than two.
		rowGap: spacingVars['--spacing-3'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4']
	},
	headerCardStandalone: {
		borderRadius: `var(--_banner-radius, ${radiusVars['--radius-container']})`
	},
	headerCardWithContent: {
		borderStartStartRadius: `var(--_banner-radius, ${radiusVars['--radius-container']})`,
		borderStartEndRadius: `var(--_banner-radius, ${radiusVars['--radius-container']})`,
		borderEndStartRadius: 0,
		borderEndEndRadius: 0
	},
	// Only a title (no description) plus actions — centre everything vertically
	headerCentered: {
		alignItems: 'center'
	},
	headerContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: 0,
		flex: 1,
		minWidth: 0
	},
	// The wrap threshold, applied only when there is `endContent` to wrap. Flex
	// breaks a line when the items no longer fit at their base size, so this
	// basis is what moves the end area to its own row instead of letting it hold
	// the header and squeeze the title down to one word per line. In rem so it
	// tracks the user's font size. The dismiss and expand controls alone are
	// narrow enough never to need it.
	headerContentWithEndContent: {
		flexBasis: '8rem'
	},
	title: {
		margin: 0,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-label-leading'],
		color: colorVars['--color-text-primary'],
		// A single unbroken token (a URL, an ID, a German compound) otherwise sets
		// the flex item's min-content width and pushes the page into horizontal
		// scrolling at 320px, which is a WCAG 1.4.10 reflow failure.
		overflowWrap: 'anywhere'
	},
	description: {
		margin: 0,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		overflowWrap: 'anywhere'
	},
	iconWrapper: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0
	},
	endArea: {
		display: 'flex',
		alignItems: 'center',
		flexWrap: 'wrap',
		justifyContent: 'flex-end',
		gap: spacingVars['--spacing-2'],
		flexShrink: 0,
		// Bounded so a group of actions wider than the row wraps within itself
		// rather than pushing the banner past the viewport (WCAG 1.4.10).
		maxWidth: '100%',
		marginInlineStart: 'auto',
		marginBlock: `calc(-1 * (${spacingVars['--spacing-3']} - ${spacingVars['--spacing-2']}))`
	},
	contentArea: {
		backgroundColor: colorVars['--color-background-card'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4'],
		borderInlineStartWidth: borderVars['--border-width'],
		borderInlineEndWidth: borderVars['--border-width'],
		borderBlockEndWidth: borderVars['--border-width'],
		borderInlineStartStyle: 'solid',
		borderInlineEndStyle: 'solid',
		borderBlockEndStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border'],
		borderInlineEndColor: colorVars['--color-border'],
		borderBlockEndColor: colorVars['--color-border']
	},
	contentAreaCard: {
		borderEndStartRadius: `var(--_banner-radius, ${radiusVars['--radius-container']})`,
		borderEndEndRadius: `var(--_banner-radius, ${radiusVars['--radius-container']})`
	},
	// Applied to the chevron <Icon> itself (via `xstyle`) rather than a wrapper,
	// so the element that rotates is the element a theme targets.
	chevron: {
		transitionProperty: 'transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronExpanded: {
		transform: 'rotate(180deg)'
	}
});

/**
 * Resting elevation, new in 0.1.9. Paired with `rootElevatedCard` at the call
 * site: a raised `card` banner also needs the rounded root, or the shadow
 * traces square corners around rounded content.
 */
const elevationStyles = stylex.create({
	none: { boxShadow: 'none' },
	low: { boxShadow: shadowVars['--shadow-low'] },
	med: { boxShadow: shadowVars['--shadow-med'] },
	high: { boxShadow: shadowVars['--shadow-high'] }
});

const statusStyles = stylex.create({
	info: {
		backgroundColor: colorVars['--color-accent-muted']
	},
	warning: {
		backgroundColor: colorVars['--color-warning-muted']
	},
	error: {
		backgroundColor: colorVars['--color-error-muted']
	},
	success: {
		backgroundColor: colorVars['--color-success-muted']
	}
});

/**
 * Narrows an augmented `BannerStatus` to one the style map actually carries, so
 * an unknown status renders with no status fill rather than resolving to
 * `undefined`. `BannerStatusMap` is declaration-merged by theme packages, so
 * every status lookup in this component is partial by construction — a
 * `stylex.create` map cannot be declared `Partial`, hence the guard.
 */
function hasStatusStyle(status: BannerStatus): status is BannerStatus & keyof typeof statusStyles {
	return Object.prototype.hasOwnProperty.call(statusStyles, status);
}

/** The layout-only root. */
export function bannerRootAttrs(
	elevation: Elevation,
	isCard: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.root,
		elevationStyles[elevation],
		isCard && elevation !== 'none' && styles.rootElevatedCard,
		xstyle
	);
}

/** The coloured status header — the primary theme target. */
export function bannerHeaderAttrs(
	status: BannerStatus,
	isSingleLine: boolean,
	isCard: boolean,
	showContent: boolean
): SvelteStyleAttrs {
	return sx(
		styles.header,
		isSingleLine && styles.headerCentered,
		hasStatusStyle(status) && statusStyles[status],
		isCard && (showContent ? styles.headerCardWithContent : styles.headerCardStandalone)
	);
}

export function bannerIconWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.iconWrapper);
}

export function bannerHeaderContentAttrs(hasEndContent: boolean): SvelteStyleAttrs {
	return sx(styles.headerContent, hasEndContent && styles.headerContentWithEndContent);
}

export function bannerTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.title);
}

export function bannerDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.description);
}

/** The trailing slot, pulling its margin in for an edge-compensated child. */
export function bannerEndAreaAttrs(): SvelteStyleAttrs {
	return sx(styles.endArea, edgeCompSlot.inset(spacingVars['--spacing-2']));
}

/** The collapsible content region below the header. */
export function bannerContentAreaAttrs(isCard: boolean): SvelteStyleAttrs {
	return sx(styles.contentArea, isCard && styles.contentAreaCard);
}

/**
 * Passed to the chevron `Icon`'s `xstyle`, the way upstream passes
 * `styles.chevron` and `styles.chevronExpanded` (#4838). The transition and the
 * rotation it animates now ride the glyph itself rather than a wrapper `<span>`,
 * so the element a theme targets is the element that actually moves.
 */
export const bannerChevronStyle = styles.chevron;
export const bannerChevronExpandedStyle = styles.chevronExpanded;
