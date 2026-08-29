import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	focusVars,
	radiusVars,
	shadowVars,
	sizeVars,
	spacingVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import type { TabListSize } from './tab-list-context.svelte.js';

/**
 * Ported from Astryx's `TabList/TabList.tsx` styles.
 *
 * Pure object mode: the wrapper, the strip and each arrow each merge
 * conditionals (and, for the wrapper, an `xstyle` spread) at a runtime
 * `stylex.props` call, so every key survives in upstream's `dist/`.
 */

/**
 * A scroll container clips at its padding box, and two things a tab paints sit
 * outside its own box: the focus ring (offset + width) and the selected
 * indicator, which `--_tab-indicator-bottom` pushes further down when a
 * divider rail is reserved. The strip pads by that much and takes the padding
 * straight back off with a negative margin, so nothing is clipped and the tabs
 * stay exactly where they were.
 *
 * A bleed is not free, though. The padding is real geometry: the strip's
 * border box sticks out of the TabList's, and any ancestor that scrolls counts
 * that as something to scroll to. So the ring's share of the bleed is taken
 * only while a ring is actually drawn inside the strip -- the same
 * `:has(:focus-visible)` condition that draws it -- and at rest the strip is
 * exactly as wide and as tall as the TabList, as it was before the strip could
 * scroll. The indicator's share is always taken, because the indicator is
 * always drawn.
 *
 * Turning the bleed on moves nothing: padding and negative margin cancel, so
 * the border box grows outwards and the content stays put.
 */
const RING_BLEED = `calc(${focusVars['--focus-outline-width']} + ${focusVars['--focus-outline-offset']})`;
const BLEED_VAR = '--_tab-strip-bleed';
const BLEED = `var(${BLEED_VAR})`;
const INDICATOR_BLEED = 'calc(-1 * var(--_tab-indicator-bottom, -1px))';
const BLOCK_END_BLEED = `max(${BLEED}, ${INDICATOR_BLEED})`;

/** How far the edge fade runs; wide enough to sit under an arrow. */
const FADE_WIDTH = spacingVars['--spacing-8'];

/**
 * Where the fade turns fully opaque, and — the same distance, for the same
 * reason — how far a revealed stop is kept clear of the edge. Declared as
 * scroll-padding so the browser's own focus scrolling uses it too, and read
 * back from the computed style so the arithmetic in `tab-list.svelte` has one
 * source of truth with the CSS.
 */
const SCROLL_EDGE_INSET = `calc(${BLEED} + ${FADE_WIDTH})`;

/**
 * The fade reaches transparent at the strip's *own* edge, not at the bleed
 * edge — otherwise the scroll container paints tabs past the TabList's box,
 * past a divider rail, and past the scroll arrow that caps that edge. Masking
 * the bleed costs nothing: only a faded edge is masked, and a stop at a faded
 * edge never holds focus, so the bleed is still there when the ring needs it.
 */
const FADE_FROM_START = `linear-gradient(to right, transparent ${BLEED}, black ${SCROLL_EDGE_INSET})`;
const FADE_FROM_END = `linear-gradient(to left, transparent ${BLEED}, black ${SCROLL_EDGE_INSET})`;

const styles = stylex.create({
	nav: {
		display: 'flex',
		alignItems: 'stretch',
		gap: spacingVars['--spacing-0-5'],
		maxWidth: '100%',
		minWidth: 0,
		position: 'relative'
	},
	fill: {
		width: '100%'
	},
	divider: {
		borderBottomWidth: borderVars['--border-width'],
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border'],
		// Reserve a gap between the tabs and the divider rail so the hover pill
		// (which fills the tab height) no longer touches the underline, and an
		// adjacent same-size Button aligns to the tabs rather than butting the
		// rail. The tabs keep their element-size height; this padding grows the
		// strip. `--_tab-indicator-bottom` drops the selected indicator through
		// the reserved gap (+ the 1px border) so it still sits on the rail.
		paddingBlockEnd: spacingVars['--spacing-1'],
		'--_tab-indicator-bottom': `calc(-1 * (${spacingVars['--spacing-1']} + ${borderVars['--border-width']}))`
	},
	strip: {
		display: 'flex',
		alignItems: 'stretch',
		// Inherited rather than restated so an `xstyle` gap override on the
		// TabList still reaches the tabs.
		gap: 'inherit',
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
		// Content-height, not stretched: the bleed padding below is inside the
		// strip's own height, and a stretched height would push the tabs out of
		// the scrollport.
		alignSelf: 'flex-start'
	},
	stripScroll: {
		overflowX: 'auto',
		overflowY: 'hidden',
		overscrollBehaviorX: 'contain',
		scrollPaddingInline: SCROLL_EDGE_INSET,
		scrollbarWidth: 'none',
		scrollBehavior: {
			default: 'smooth',
			'@media (prefers-reduced-motion: reduce)': 'auto'
		},
		[BLEED_VAR]: {
			default: '0px',
			':has(:focus-visible)': RING_BLEED
		},
		paddingBlockStart: BLEED,
		marginBlockStart: `calc(-1 * (${BLEED}))`,
		paddingBlockEnd: BLOCK_END_BLEED,
		marginBlockEnd: `calc(-1 * (${BLOCK_END_BLEED}))`,
		paddingInline: BLEED,
		marginInline: `calc(-1 * (${BLEED}))`,
		maskImage: 'none',
		transitionProperty: 'mask-image',
		transitionDuration: {
			default: durationVars['--duration-medium'],
			'@media (prefers-reduced-motion: reduce)': '0ms'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	fadeStart: {
		maskImage: {
			default: FADE_FROM_START,
			':is([dir="rtl"] *)': FADE_FROM_END
		}
	},
	fadeEnd: {
		maskImage: {
			default: FADE_FROM_END,
			':is([dir="rtl"] *)': FADE_FROM_START
		}
	},
	fadeBoth: {
		maskImage: `linear-gradient(to right, transparent ${BLEED}, black ${SCROLL_EDGE_INSET}, black calc(100% - ${SCROLL_EDGE_INSET}), transparent calc(100% - ${BLEED}))`
	},
	arrow: {
		position: 'absolute',
		insetBlockStart: 0,
		// A pointer-only affordance: keyboard and assistive-technology users move
		// through the strip with the arrow keys, which scrolls the focused tab
		// into view on its own.
		display: {
			default: 'none',
			'@media (hover: hover)': 'flex'
		},
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: radiusVars['--radius-full'],
		// Opaque, because it sits over the tabs it scrolls: the strip's edge fade
		// thins the content underneath but does not clear it.
		backgroundColor: colorVars['--color-background-popover'],
		boxShadow: shadowVars['--shadow-low'],
		color: {
			default: colorVars['--color-text-secondary'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': colorVars['--color-text-primary']
		},
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	arrowStart: {
		insetInlineStart: 0
	},
	arrowEnd: {
		insetInlineEnd: 0
	}
});

const arrowSizeStyles = stylex.create({
	sm: {
		width: sizeVars['--size-element-sm'],
		height: sizeVars['--size-element-sm']
	},
	md: {
		width: sizeVars['--size-element-md'],
		height: sizeVars['--size-element-md']
	},
	lg: {
		width: sizeVars['--size-element-lg'],
		height: sizeVars['--size-element-lg']
	}
});

/** Which edge fades are drawn, or `null` for none. */
export type TabStripFade = 'start' | 'end' | 'both' | null;

/** The wrapper that holds the tab strip — a `<nav>`, or a `<div>` for a tablist. */
export function tabListNavAttrs(
	isFill: boolean,
	hasDivider: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.nav, isFill && styles.fill, hasDivider && styles.divider, xstyle);
}

/** The scrollport holding the tabs. */
export function tabStripAttrs(hasScroll: boolean, fade: TabStripFade): SvelteStyleAttrs {
	return sx(
		styles.strip,
		hasScroll && styles.stripScroll,
		fade === 'both'
			? styles.fadeBoth
			: fade === 'start'
				? styles.fadeStart
				: fade === 'end'
					? styles.fadeEnd
					: null
	);
}

/** One of the two pointer-only scroll arrows capping the strip. */
export function tabScrollButtonAttrs(edge: 'start' | 'end', size: TabListSize): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.arrow,
		edge === 'start' ? styles.arrowStart : styles.arrowEnd,
		arrowSizeStyles[size]
	);
}
