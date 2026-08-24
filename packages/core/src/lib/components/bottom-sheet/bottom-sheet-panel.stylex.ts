import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { overlayPaddingReset } from '../../internal/padding.stylex.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	sizeVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `BottomSheet/BottomSheetPanel.tsx` styles.
 *
 * Everything intrinsic to a sheet *surface*: height budgets, the handle and
 * scrolling body, and the motion styles. The dialog, focus, inert state and
 * switcher registration belong to the hosting controller and are not here.
 */

const HEIGHT_BUDGETS = {
	hug: '92dvh',
	capped: '62dvh',
	tall: '92dvh'
} as const;

export type BottomSheetHeight = keyof typeof HEIGHT_BUDGETS;

/** SYNC: must match `OVERSCROLL_MAX` in `use-sheet-gestures.svelte.ts`. */
const OVERSCROLL_PADDING = 48;
const MOBILE_KEYBOARD_BOTTOM_CLEARANCE = 48;
// The floating handle bar's height. The bar is out of flow, so this is not
// layout space the content pays for — the pill (4px, centered) lands 10-14px
// from the sheet's top edge, inside the space a content wrapper's own top
// padding already provides.
const HANDLE_BAR_HEIGHT = spacingVars['--spacing-6'];

const styles = stylex.create({
	sheet: {
		pointerEvents: 'auto',
		boxSizing: 'border-box',
		// Containing block for the floating handle bar, which is lifted out of
		// flow so the scrolling body reaches the sheet's top edge.
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		minHeight: 0,
		width: '100%',
		maxWidth: 640,
		backgroundColor: colorVars['--color-background-surface'],
		// Hairline on the three edges that face the scrim. The surface fill alone
		// separates sheet from scrim in light mode, but not in dark: there the two
		// sit within a few RGB steps of each other and the drop shadow is black on
		// near-black, so the sheet's left and right edges disappear. Same treatment
		// `MobileNav` gives its scrim-facing edge. The block-end edge is
		// deliberately left bare; it sits below the viewport, under the overscroll
		// padding.
		borderBlockStartWidth: borderVars['--border-width'],
		borderBlockStartStyle: 'solid',
		borderBlockStartColor: colorVars['--color-border'],
		borderInlineStartWidth: borderVars['--border-width'],
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border'],
		borderInlineEndWidth: borderVars['--border-width'],
		borderInlineEndStyle: 'solid',
		borderInlineEndColor: colorVars['--color-border'],
		borderStartStartRadius: radiusVars['--radius-container'],
		borderStartEndRadius: radiusVars['--radius-container'],
		boxShadow: shadowVars['--shadow-high'],
		outline: 'none',
		overflow: 'hidden',
		paddingBlockEnd: `calc(env(safe-area-inset-bottom, 0px) + ${OVERSCROLL_PADDING}px)`,
		marginBlockEnd: `${-OVERSCROLL_PADDING}px`,
		transform: {
			default: 'translateY(0)',
			'@starting-style': 'translateY(100%)'
		},
		opacity: 1,
		transitionProperty: 'transform, opacity',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard'],
		willChange: 'transform, opacity',
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	/**
	 * The exit is its own motion, not the entrance played backwards.
	 *
	 * `--ease-standard` is `cubic-bezier(0.24, 1, 0.4, 1)`, a decelerate curve: it
	 * spends its speed immediately and coasts. That is right for an entrance,
	 * where the sheet arrives fast and settles, and wrong for an exit. Measured on
	 * device, it put the sheet half off-screen in 59ms of a 410ms close and 90%
	 * off in 163ms — the travel is over before the eye has followed it, and the
	 * rest of the duration moves pixels already below the fold.
	 *
	 * An exit accelerates instead: away from rest, gathering speed, quickest as it
	 * leaves the screen. The curve is deliberately gentle rather than a hard
	 * `ease-in` — it is moving within ~50ms, so the close reads as one departure
	 * rather than a hesitation and a snap. The duration is the entrance's own
	 * band, so only the curve differs between the two directions; a shorter band
	 * leaves too little visible travel once a theme scales the motion scale down
	 * (neutral's medium is 300ms against 410ms).
	 */
	sheetClosing: {
		transform: 'translateY(100%)',
		transitionTimingFunction: 'cubic-bezier(0.3, 0, 0.6, 0.6)'
	},
	sheetFading: {
		opacity: 0
	},
	sheetInactive: {
		pointerEvents: 'none'
	},
	handleBar: {
		// Floats over the body rather than taking a row in the flex column. The
		// content starts at the sheet's top edge and rides up under the pill — both
		// moving it closer to the top and letting scrolled content pass beneath
		// instead of stopping at a hard edge.
		position: 'absolute',
		insetBlockStart: 0,
		insetInlineStart: 0,
		insetInlineEnd: 0,
		zIndex: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: HANDLE_BAR_HEIGHT,
		// Keeps the pill legible over whatever sits or scrolls under it: opaque
		// surface behind the pill itself, fading out across the lower half so the
		// content emerging below has no visible cut line.
		backgroundImage: `linear-gradient(to bottom, ${colorVars['--color-background-surface']} 60%, transparent)`,
		touchAction: 'none',
		cursor: {
			default: 'grab',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	handlePill: {
		width: sizeVars['--size-element-lg'],
		height: spacingVars['--spacing-1'],
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: colorVars['--color-border']
	},
	body: {
		flexGrow: 1,
		minHeight: 0,
		boxSizing: 'border-box',
		overflowY: 'auto',
		overscrollBehavior: 'none',
		touchAction: 'pan-y',
		// The scrolling area paints the surface itself, covering the sheet's whole
		// inner box. Without it the sheet's edge is not uniform: a theme that packs
		// an inset ring into `--shadow-high` (the bundled themes all add one in dark
		// mode) draws that ring just inside the sheet, where an opaque content
		// wrapper such as `Section` paints over it — so the ring shows only in the
		// gap below where the content ends, and the sheet's side edges appear to
		// change width partway down. Painting the surface here hides the ring
		// evenly, leaving the border below as the sheet's one edge.
		backgroundColor: colorVars['--color-background-surface'],
		// No reserve for the handle bar: it floats, so the content starts at the
		// sheet's top edge and rides up under the pill. The pill is 4px centered in
		// a 24px band, so it occupies only 10-14px from the edge — inside the space
		// a content wrapper's own top padding already provides.
		paddingBlockEnd: 0
	},
	tallKeyboardBody: {
		scrollPaddingBlockEnd: MOBILE_KEYBOARD_BOTTOM_CLEARANCE,
		'::after': {
			content: '""',
			display: 'block',
			blockSize: 'var(--_sheet-keyboard-inset, 0px)',
			pointerEvents: 'none'
		}
	},
	budget: {
		height: `calc(var(--_sheet-budget) + ${OVERSCROLL_PADDING}px)`
	},
	hugHeight: {
		height: 'fit-content',
		maxHeight: `calc(${HEIGHT_BUDGETS.hug} + ${OVERSCROLL_PADDING}px)`
	}
});

export { OVERSCROLL_PADDING, MOBILE_KEYBOARD_BOTTOM_CLEARANCE, HEIGHT_BUDGETS };

/** The sliding surface. */
export function bottomSheetPanelAttrs(
	isClosing: boolean,
	isFading: boolean,
	isInactive: boolean,
	isHug: boolean,
	hasBudget: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.sheet,
		overlayPaddingReset.reset,
		isHug && styles.hugHeight,
		hasBudget && styles.budget,
		isClosing && styles.sheetClosing,
		isFading && styles.sheetFading,
		isInactive && styles.sheetInactive,
		xstyle
	);
}

/** The grab-handle row. */
export function bottomSheetHandleBarAttrs(): SvelteStyleAttrs {
	return sx(styles.handleBar);
}

/** The pill inside the grab handle. */
export function bottomSheetHandlePillAttrs(): SvelteStyleAttrs {
	return sx(styles.handlePill);
}

/** The scrolling body. `isTallKeyboard` adds the keyboard inset spacer. */
export function bottomSheetBodyAttrs(isTallKeyboard: boolean): SvelteStyleAttrs {
	return sx(styles.body, isTallKeyboard && styles.tallKeyboardBody);
}
