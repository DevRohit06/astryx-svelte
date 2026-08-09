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
 * dynamic `edgeCompSlot.inset`. The text slots, the icon wrapper, the chevron
 * and the content area are single call sites and were folded into literal class
 * strings.
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
		borderRadius: radiusVars['--radius-container']
	},
	// Header area — colored status background with icon, title, description, actions
	header: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4']
	},
	headerCardStandalone: {
		borderRadius: radiusVars['--radius-container']
	},
	headerCardWithContent: {
		borderStartStartRadius: radiusVars['--radius-container'],
		borderStartEndRadius: radiusVars['--radius-container'],
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
	title: {
		margin: 0,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-label-leading'],
		color: colorVars['--color-text-primary']
	},
	description: {
		margin: 0,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	iconWrapper: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0
	},
	endArea: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		flexShrink: 0,
		marginInlineStart: 'auto',
		marginBlock: `calc(-1 * (${spacingVars['--spacing-3']} - ${spacingVars['--spacing-2']}))`
	},
	contentArea: {
		backgroundColor: colorVars['--color-background-card'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4'],
		borderInlineStartWidth: borderVars['--border-width'],
		borderInlineEndWidth: borderVars['--border-width'],
		borderBottomWidth: borderVars['--border-width'],
		borderInlineStartStyle: 'solid',
		borderInlineEndStyle: 'solid',
		borderBottomStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border'],
		borderInlineEndColor: colorVars['--color-border'],
		borderBottomColor: colorVars['--color-border']
	},
	contentAreaCard: {
		borderEndStartRadius: radiusVars['--radius-container'],
		borderEndEndRadius: radiusVars['--radius-container']
	},
	chevron: {
		display: 'inline-flex',
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
		statusStyles[status],
		isCard && (showContent ? styles.headerCardWithContent : styles.headerCardStandalone)
	);
}

export function bannerIconWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.iconWrapper);
}

export function bannerHeaderContentAttrs(): SvelteStyleAttrs {
	return sx(styles.headerContent);
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

/** The expand/collapse chevron, rotated when open. */
export function bannerChevronAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(styles.chevron, isExpanded && styles.chevronExpanded);
}
