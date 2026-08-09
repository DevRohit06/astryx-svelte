import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SpacingStep } from '../../internal/types.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/** The gap steps `Carousel` accepts — narrower than the full spacing scale. */
export type CarouselGap = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4;

/**
 * Ported from Astryx's `Carousel/Carousel.tsx` styles.
 *
 * Everything except `item` and the button pill survives as an object in
 * upstream's `dist/`: the scroller merges a dynamic `gapStyles[gap]` index with
 * three conditionals, and the root takes an `xstyle` spread. The item wrapper is
 * one call site, and the pill resolves to four literal strings (start/end ×
 * hidden/visible).
 */
const styles = stylex.create({
	root: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		minWidth: 0,
		maxWidth: '100%',
		overflow: 'clip',
		overflowClipMargin: '1px'
	},
	scroller: {
		display: 'flex',
		alignItems: 'center',
		overflowX: 'auto',
		overflowY: 'hidden',
		// 1px bleed for a child's selection indicator; no token at this size
		paddingBottom: '1px',
		marginBottom: '-1px',
		overscrollBehaviorX: 'contain',
		scrollBehavior: {
			default: 'smooth',
			'@media (prefers-reduced-motion: reduce)': 'auto'
		},
		scrollbarWidth: 'none',
		maskImage: 'none',
		transitionProperty: 'mask-image',
		transitionDuration: {
			default: durationVars['--duration-medium'],
			'@media (prefers-reduced-motion: reduce)': '0ms'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	fadeStart: {
		maskImage: `linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 2px, black ${spacingVars['--spacing-1']})`
	},
	fadeEnd: {
		maskImage: `linear-gradient(to left, transparent 0%, rgba(0,0,0,0.3) 2px, black ${spacingVars['--spacing-1']})`
	},
	fadeBoth: {
		maskImage: `linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 2px, black ${spacingVars['--spacing-1']}, black calc(100% - ${spacingVars['--spacing-1']}), rgba(0,0,0,0.3) calc(100% - 2px), transparent 100%)`
	},
	snap: {
		scrollSnapType: 'x mandatory'
	},
	item: {
		scrollSnapAlign: 'start',
		display: 'flex',
		flexShrink: 0
	},
	// Overlay on the top layer — covers the carousel anchor area
	buttonOverlay: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		pointerEvents: 'none'
	},
	buttonPill: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colorVars['--color-background-popover'],
		borderRadius: radiusVars['--radius-full'],
		boxShadow: shadowVars['--shadow-med'],
		pointerEvents: 'auto',
		opacity: 1,
		transitionProperty: 'opacity',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	buttonPillStart: {
		transform: {
			default: 'translateX(-50%)',
			':is([dir="rtl"] *)': 'translateX(50%)'
		}
	},
	buttonPillEnd: {
		transform: {
			default: 'translateX(50%)',
			':is([dir="rtl"] *)': 'translateX(-50%)'
		}
	},
	buttonHidden: {
		opacity: 0,
		pointerEvents: 'none'
	},
	buttonRadiusOverride: {
		'--_button-radius': radiusVars['--radius-full']
	}
});

const gapStyles = stylex.create({
	0: { gap: spacingVars['--spacing-0'] },
	0.5: { gap: spacingVars['--spacing-0-5'] },
	1: { gap: spacingVars['--spacing-1'] },
	1.5: { gap: spacingVars['--spacing-1-5'] },
	2: { gap: spacingVars['--spacing-2'] },
	3: { gap: spacingVars['--spacing-3'] },
	4: { gap: spacingVars['--spacing-4'] }
});

const paddingStyles = stylex.create({
	0: {
		paddingInline: spacingVars['--spacing-0'],
		scrollPaddingInline: spacingVars['--spacing-0']
	},
	0.5: {
		paddingInline: spacingVars['--spacing-0-5'],
		scrollPaddingInline: spacingVars['--spacing-0-5']
	},
	1: {
		paddingInline: spacingVars['--spacing-1'],
		scrollPaddingInline: spacingVars['--spacing-1']
	},
	1.5: {
		paddingInline: spacingVars['--spacing-1-5'],
		scrollPaddingInline: spacingVars['--spacing-1-5']
	},
	2: {
		paddingInline: spacingVars['--spacing-2'],
		scrollPaddingInline: spacingVars['--spacing-2']
	},
	3: {
		paddingInline: spacingVars['--spacing-3'],
		scrollPaddingInline: spacingVars['--spacing-3']
	},
	4: {
		paddingInline: spacingVars['--spacing-4'],
		scrollPaddingInline: spacingVars['--spacing-4']
	},
	5: {
		paddingInline: spacingVars['--spacing-5'],
		scrollPaddingInline: spacingVars['--spacing-5']
	},
	6: {
		paddingInline: spacingVars['--spacing-6'],
		scrollPaddingInline: spacingVars['--spacing-6']
	},
	8: {
		paddingInline: spacingVars['--spacing-8'],
		scrollPaddingInline: spacingVars['--spacing-8']
	},
	10: {
		paddingInline: spacingVars['--spacing-10'],
		scrollPaddingInline: spacingVars['--spacing-10']
	}
});

/** The clipping wrapper that also anchors the button layer. */
export function carouselRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The horizontal scroll container, with its gap, padding, snap and edge fade. */
export function carouselScrollerAttrs(
	gap: CarouselGap,
	padding: SpacingStep | undefined,
	hasSnap: boolean,
	fade: 'start' | 'end' | 'both' | null
): SvelteStyleAttrs {
	return sx(
		styles.scroller,
		gapStyles[gap],
		padding != null && paddingStyles[padding],
		hasSnap && styles.snap,
		fade === 'both'
			? styles.fadeBoth
			: fade === 'start'
				? styles.fadeStart
				: fade === 'end'
					? styles.fadeEnd
					: null
	);
}

/** One item's wrapper — the snap target. */
export function carouselItemAttrs(): SvelteStyleAttrs {
	return sx(styles.item);
}

/** The layer that covers the anchor and holds the two nav pills. */
export const carouselButtonOverlay: StyleArg = styles.buttonOverlay;

/** A nav button's circular surface, faded out when it has nowhere to scroll. */
export function carouselButtonPillAttrs(
	side: 'start' | 'end',
	isHidden: boolean
): SvelteStyleAttrs {
	return sx(
		styles.buttonPill,
		side === 'start' ? styles.buttonPillStart : styles.buttonPillEnd,
		isHidden && styles.buttonHidden
	);
}

/** Rounds the nav `Button` fully, overriding its own radius token. */
export const carouselButtonRadiusOverride: StyleArg = styles.buttonRadiusOverride;
