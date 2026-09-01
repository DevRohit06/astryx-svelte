import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';
import type { ToastPosition } from './types.js';

const SAFE_AREA_INLINE_START = `max(${spacingVars['--spacing-4']}, env(safe-area-inset-left, 0px))`;
const SAFE_AREA_INLINE_END = `max(${spacingVars['--spacing-4']}, env(safe-area-inset-right, 0px))`;
const SAFE_AREA_BLOCK_START = `max(${spacingVars['--spacing-4']}, env(safe-area-inset-top, 0px))`;
const SAFE_AREA_BLOCK_END = `max(${spacingVars['--spacing-4']}, env(safe-area-inset-bottom, 0px))`;
const TOAST_EDGE_DRIFT = spacingVars['--spacing-2'];
const TOAST_EDGE_DRIFT_NEGATIVE = `calc(-1 * ${TOAST_EDGE_DRIFT})`;

const styles = stylex.create({
	viewport: {
		position: 'fixed',
		zIndex: 500,
		display: 'flex',
		boxSizing: 'border-box',
		flexDirection: 'column',
		paddingBlockStart: SAFE_AREA_BLOCK_START,
		paddingBlockEnd: SAFE_AREA_BLOCK_END,
		paddingInlineStart: {
			default: SAFE_AREA_INLINE_START,
			':is([dir="rtl"] *)': SAFE_AREA_INLINE_END
		},
		paddingInlineEnd: {
			default: SAFE_AREA_INLINE_END,
			':is([dir="rtl"] *)': SAFE_AREA_INLINE_START
		},
		pointerEvents: 'none',
		// Reset popover styles — the popover attribute puts us in the top
		// layer (above dialogs), but we don't want its default styles.
		// UA stylesheet applies background-color: Canvas, margin: auto, etc.
		inset: 'unset',
		margin: 0,
		border: 'none',
		background: 'none',
		backgroundColor: 'transparent',
		overflow: 'visible'
	},
	viewportInlineSpan: {
		insetInlineStart: 0,
		insetInlineEnd: 0
	},
	bottomEnd: { bottom: 0, alignItems: 'flex-end' },
	bottomStart: { bottom: 0, alignItems: 'flex-start' },
	topEnd: {
		top: 0,
		alignItems: 'flex-end',
		flexDirection: 'column-reverse'
	},
	topStart: {
		top: 0,
		alignItems: 'flex-start',
		flexDirection: 'column-reverse'
	},
	toastWrapper: {
		pointerEvents: 'auto',
		display: 'grid',
		width: '100%',
		maxWidth: 400,
		minWidth: 0,
		gridTemplateRows: '1fr',
		transitionProperty: 'grid-template-rows, padding',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0.01ms'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		'@starting-style': {
			gridTemplateRows: '0fr',
			paddingBlockEnd: 0
		}
	},
	toastWrapperFromBottom: {
		'--_toast-slide-y': TOAST_EDGE_DRIFT
	},
	toastWrapperFromTop: {
		'--_toast-slide-y': TOAST_EDGE_DRIFT_NEGATIVE
	},
	// The inter-toast gap is padding on each wrapper so it collapses with the
	// grid track. The wrapper nearest the viewport edge drops that padding; the
	// child flips because top stacks use column-reverse.
	toastWrapperGap: {
		paddingBlockEnd: { default: spacingVars['--spacing-2'], ':last-child': 0 }
	},
	toastWrapperGapReversed: {
		paddingBlockEnd: { default: spacingVars['--spacing-2'], ':first-child': 0 }
	},
	toastWrapperExiting: {
		gridTemplateRows: '0fr',
		paddingBlockEnd: 0
	},
	toastWrapperInner: {
		width: '100%',
		maxWidth: '100%',
		minWidth: 0,
		minHeight: 0,
		// Required for the 1fr -> 0fr exit collapse to hide the shrinking Toast.
		// This preserves main's paint containment; browser-chrome behavior is not
		// changed or claimed by this responsive-layout fix.
		overflow: 'hidden'
	}
});

/**
 * Upstream's if/else chain: any value other than the three named positions
 * falls through to `bottomEnd`, which is also the prop default.
 */
function positionStyle(position: ToastPosition) {
	if (position === 'topEnd') return styles.topEnd;
	if (position === 'topStart') return styles.topStart;
	if (position === 'bottomStart') return styles.bottomStart;
	return styles.bottomEnd;
}

/**
 * Upstream's `isReversed`. The two top placements stack `column-reverse`, so a
 * card enters *downward* from the top edge and the inter-toast gap hangs off
 * the first child rather than the last.
 */
function isReversedPosition(position: ToastPosition): boolean {
	return position === 'topEnd' || position === 'topStart';
}

export function toastViewportAttrs(position: ToastPosition): SvelteStyleAttrs {
	return sx(styles.viewport, styles.viewportInlineSpan, positionStyle(position));
}

export function toastWrapperAttrs(position: ToastPosition, isExiting: boolean): SvelteStyleAttrs {
	const isReversed = isReversedPosition(position);
	return sx(
		styles.toastWrapper,
		isReversed ? styles.toastWrapperFromTop : styles.toastWrapperFromBottom,
		isReversed ? styles.toastWrapperGapReversed : styles.toastWrapperGap,
		isExiting && styles.toastWrapperExiting
	);
}

export function toastWrapperInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.toastWrapperInner);
}
