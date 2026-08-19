import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
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

const styles = stylex.create({
	sheet: {
		pointerEvents: 'auto',
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		minHeight: 0,
		width: '100%',
		maxWidth: 640,
		backgroundColor: colorVars['--color-background-surface'],
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
	sheetClosing: {
		transform: 'translateY(100%)'
	},
	sheetFading: {
		opacity: 0
	},
	sheetInactive: {
		pointerEvents: 'none'
	},
	handleBar: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: spacingVars['--spacing-12'],
		touchAction: 'none',
		cursor: 'grab'
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

/** The height budget a named height resolves to, or `null` for a custom one. */
export function heightBudgetFor(height: BottomSheetHeight | number | string): string | null {
	if (typeof height === 'string' && height in HEIGHT_BUDGETS) {
		return HEIGHT_BUDGETS[height as BottomSheetHeight];
	}
	return null;
}

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
