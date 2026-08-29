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

/** Ported from the `styles` block in Astryx's `Chat/ChatComposerDrawer.tsx`. */
const styles = stylex.create({
	root: {
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		paddingInline: spacingVars['--spacing-4'],
		paddingBlockStart: spacingVars['--spacing-3'],
		// The drawer tucks behind the composer (negative marginBlockEnd) and its
		// top corners align with the composer's outer radius. Tracks the chat
		// radius to stay matched to the composer, decoupled from --radius-page. #2072
		paddingBlockEnd: `calc(${spacingVars['--spacing-3']} + ${radiusVars['--radius-chat']})`,
		marginBlockEnd: `calc(-1 * ${radiusVars['--radius-chat']})`,
		// Surface base with a muted tint layered on top, both in the element's
		// own background layer. The muted backgroundImage composites over the
		// surface backgroundColor and — by CSS rule — paints behind all in-flow
		// content (tokens, labels, collapse handle) automatically. This restores
		// the original "surface bg + muted tint" intent (#1182) without a
		// positioned ::before, so it needs no z-index and works whether muted is
		// opaque or translucent.
		backgroundColor: colorVars['--color-background-surface'],
		backgroundImage: `linear-gradient(${colorVars['--color-background-muted']}, ${colorVars['--color-background-muted']})`,
		borderStartStartRadius: radiusVars['--radius-chat'],
		borderStartEndRadius: radiusVars['--radius-chat']
	},

	// Toggle row — both the bar handle and badge+label live in the
	// same grid cell so they crossfade without layout shift.
	toggleRow: {
		display: 'grid',
		gridTemplateColumns: '1fr',
		alignItems: 'center',
		height: spacingVars['--spacing-5'],
		paddingInline: spacingVars['--spacing-4'],
		marginInline: `calc(-1 * ${spacingVars['--spacing-4']})`,
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		userSelect: 'none'
	},
	toggleCollapsed: {},
	toggleContent: {
		gridRow: 1,
		gridColumn: 1,
		justifySelf: 'start',
		display: 'inline-flex',
		alignItems: 'center',
		height: spacingVars['--spacing-5'],
		gap: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-full'],
		opacity: 1,
		transitionProperty: 'opacity',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	toggleContentHidden: {
		opacity: 0,
		pointerEvents: 'none' as const
	},
	collapseLabel: {
		color: {
			default: colorVars['--color-text-secondary'],
			[stylex.when.ancestor(':hover')]: {
				'@media (hover: hover)': colorVars['--color-text-primary']
			}
		},
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: spacingVars['--spacing-5'],
		transitionProperty: 'color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	collapseBarHandle: {
		gridRow: 1,
		gridColumn: 1,
		justifySelf: 'center',
		alignSelf: 'start',
		width: spacingVars['--spacing-5'],
		height: spacingVars['--spacing-0-5'],
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: {
			default: colorVars['--color-icon-secondary'],
			[stylex.when.ancestor(':hover')]: {
				'@media (hover: hover)': colorVars['--color-icon-primary']
			}
		},
		opacity: 1,
		transitionProperty: 'background-color, opacity',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	collapseBarHandleHidden: {
		opacity: 0,
		pointerEvents: 'none' as const
	},

	// Animated content area — height collapses via grid-template-rows,
	// items stay in place and fade in/out (no translateY slide).
	contentGrid: {
		display: 'grid',
		gridTemplateRows: '1fr',
		transitionProperty: 'grid-template-rows',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	contentGridCollapsed: {
		gridTemplateRows: '0fr'
	},
	content: {
		minHeight: 0,
		display: 'flex',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-1'],
		alignItems: 'flex-start',
		opacity: 1,
		transitionProperty: 'opacity',
		transitionDuration: durationVars['--duration-medium'],
		transitionDelay: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	contentCollapsed: {
		opacity: 0,
		transitionDelay: '0ms',
		transitionDuration: durationVars['--duration-fast']
	}
});

export function chatComposerDrawerRootAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

export function chatComposerDrawerToggleRowAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.toggleRow, isCollapsed && styles.toggleCollapsed, stylex.defaultMarker());
}

export function chatComposerDrawerToggleContentAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.toggleContent, !isCollapsed && styles.toggleContentHidden);
}

export function chatComposerDrawerCollapseLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.collapseLabel);
}

export function chatComposerDrawerBarHandleAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.collapseBarHandle, isCollapsed && styles.collapseBarHandleHidden);
}

export function chatComposerDrawerContentGridAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.contentGrid, isCollapsed && styles.contentGridCollapsed);
}

export function chatComposerDrawerContentAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.content, isCollapsed && styles.contentCollapsed);
}
