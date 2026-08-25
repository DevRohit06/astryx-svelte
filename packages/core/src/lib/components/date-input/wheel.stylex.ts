import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	fontWeightVars,
	typeScaleVars,
	spacingVars,
	durationVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';
import { dateInputTouchSizes, dateInputTouchGeometry } from './tokens.stylex.js';

/**
 * Ported from Astryx's `DateInput/Wheel.tsx`, where the styles are inline in
 * the component file rather than in a module of their own.
 *
 * A wheel is a scroll container, not a custom gesture surface. Momentum,
 * rubber-banding, and the settle animation are the platform's; all this adds
 * is `scroll-snap-align: center` on each option, half a viewport of padding at
 * each end so the first and last option can reach the middle, and a commit
 * when the scrolling stops.
 *
 * The falloff (rows fading and tipping away from the centre) is a CSS
 * scroll-driven animation on a `view()` timeline — the browser interpolates it
 * against each row's own position in the scrollport, so it stays glued to the
 * finger with no JS in the frame loop. It is guarded by `@supports`, because a
 * browser that does not understand `animation-timeline` would otherwise run
 * the same keyframes on the document timeline and simply play them once.
 */

const ITEM_BLOCK_SIZE = dateInputTouchSizes.wheelItemSize;

/**
 * Rows tip away from the centre of the wheel. 0% is a row just entering at the
 * bottom of the scrollport, 50% is a row centred in it, 100% is a row leaving
 * at the top — which is what a `view()` timeline over the `cover` range means,
 * and why this reads as a cylinder rotating under the finger.
 */
const falloff = stylex.keyframes({
	'0%': {
		opacity: 0.3,
		transform: 'rotateX(52deg) scale(0.86)'
	},
	'50%': {
		opacity: 1,
		transform: 'rotateX(0deg) scale(1)'
	},
	'100%': {
		opacity: 0.3,
		transform: 'rotateX(-52deg) scale(0.86)'
	}
});

/** Motion-free equivalent: the depth cue survives as opacity alone. */
const fadeOnly = stylex.keyframes({
	'0%': { opacity: 0.3 },
	'50%': { opacity: 1 },
	'100%': { opacity: 0.3 }
});

const styles = stylex.create({
	column: {
		position: 'relative',
		flex: '1 1 0',
		minWidth: 0
	},
	scroller: {
		blockSize: dateInputTouchGeometry.paneBlockSize,
		// Load-bearing, and stated rather than inherited from the reset (whose
		// rule is zero-specificity `:where`): with content-box the end padding
		// below would be added to the scrollport instead of sitting inside it,
		// and every snap position would be wrong.
		boxSizing: 'border-box',
		overflowY: 'auto',
		overflowX: 'hidden',
		// Snap every row to the middle of the scrollport, where the selection band
		// sits. `mandatory` (not `proximity`) because a wheel has no valid resting
		// position between two options.
		scrollSnapType: 'y mandatory',
		overscrollBehavior: 'contain',
		// Room for row 0 and row n-1 to reach the centre.
		paddingBlock: dateInputTouchGeometry.wheelEdgePadding,
		// Gives the rotateX falloff somewhere to recede to.
		perspective: '520px',
		transformStyle: 'preserve-3d',
		scrollbarWidth: 'none',
		outline: 'none',
		touchAction: 'pan-y'
	},
	item: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		blockSize: ITEM_BLOCK_SIZE,
		paddingInline: spacingVars['--spacing-2'],
		scrollSnapAlign: 'center',
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		// Larger than body text, and larger than the calendar's day numbers: on
		// a wheel the value under the band is the whole interface, and the rows
		// above and below are read at a glance while moving.
		fontSize: typeScaleVars['--text-large-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-primary'],
		whiteSpace: 'nowrap',
		// NO `overflow: hidden` here. It would make the row itself a scroll
		// container, and `view()` binds to the subject's nearest ancestor scroll
		// container — the falloff would measure the row against itself and sit
		// frozen at 50% forever. Clipping belongs on the inner element.
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		userSelect: 'none',
		transitionProperty: 'color, font-weight',
		transitionDuration: durationVars['--duration-fast']
	},
	/**
	 * The falloff rides an inner element, never the row itself.
	 *
	 * A snap area is the element's TRANSFORMED border box, so animating the row
	 * would move the very positions the scroller is snapping to — the wheel
	 * settles a few pixels off, and the offset feeds back into the animation.
	 * Transforming a child leaves the row's box, and every snap offset, exact.
	 */
	itemInner: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		inlineSize: '100%',
		blockSize: '100%',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		// The wheel look. Held behind @supports so browsers without scroll-driven
		// animations get a plain, fully legible list instead of these keyframes
		// playing themselves out once on the document timeline. Under reduced
		// motion the same timeline drives opacity only — the depth cue survives,
		// the tipping does not.
		animationName: {
			default: null,
			'@supports (animation-timeline: view())': {
				default: falloff,
				'@media (prefers-reduced-motion: reduce)': fadeOnly
			}
		},
		animationTimeline: 'view(y)',
		animationRange: 'cover 0% cover 100%',
		animationFillMode: 'both',
		animationDuration: 'auto',
		animationTimingFunction: 'linear',
		backfaceVisibility: 'hidden'
	},
	itemActive: {
		color: colorVars['--color-text-accent'],
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	itemDisabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'default'
	},
	/**
	 * The selection band: a single centred row-height plate behind the options.
	 * Purely decorative — the committed value is announced by `aria-selected`.
	 */
	band: {
		position: 'absolute',
		insetInline: 0,
		insetBlockStart: `calc(50% - (${ITEM_BLOCK_SIZE} / 2))`,
		blockSize: ITEM_BLOCK_SIZE,
		borderRadius: radiusVars['--radius-element'],
		// `--color-neutral`, not `--color-background-muted`. Muted is 4.7% alpha,
		// which puts the whole plate 17 units of colour away from the sheet
		// behind it — so when the wheels fade in, the band's animation has 17
		// units to happen in while the text beside it travels 412. It did not
		// read as fading, it read as appearing. Neutral is 10%, which doubles the
		// range to 36 and is still quiet enough to sit under text.
		backgroundColor: colorVars['--color-neutral'],
		pointerEvents: 'none'
	}
});

/** The positioned column the band and the scroller share. */
export function wheelColumnAttrs(): SvelteStyleAttrs {
	return sx(styles.column);
}

/** The decorative selection plate behind the options. */
export function wheelBandAttrs(): SvelteStyleAttrs {
	return sx(styles.band);
}

/** The `role="listbox"` scrollport. */
export function wheelScrollerAttrs(): SvelteStyleAttrs {
	return sx(styles.scroller, focusOutlineStyles.focusVisible);
}

/**
 * One `role="option"` row. The order is upstream's four-entry lookup table:
 * `item`, then the active highlight, then the disabled treatment — so a
 * disabled row that also happens to be active reads as disabled.
 */
export function wheelItemAttrs(isActive: boolean, isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.item, isActive && styles.itemActive, isDisabled && styles.itemDisabled);
}

/** The inner span the scroll-driven falloff rides on. */
export function wheelItemInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.itemInner);
}
