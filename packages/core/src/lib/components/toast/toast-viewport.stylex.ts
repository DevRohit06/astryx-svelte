import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';
import type { ToastPosition } from './types.js';

const styles = stylex.create({
	viewport: {
		position: 'fixed',
		zIndex: 500,
		display: 'flex',
		flexDirection: 'column',
		padding: spacingVars['--spacing-4'],
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
	bottomEnd: { bottom: 0, insetInlineEnd: 0, alignItems: 'flex-end' },
	bottomStart: { bottom: 0, insetInlineStart: 0, alignItems: 'flex-start' },
	topEnd: {
		top: 0,
		insetInlineEnd: 0,
		alignItems: 'flex-end',
		flexDirection: 'column-reverse'
	},
	topStart: {
		top: 0,
		insetInlineStart: 0,
		alignItems: 'flex-start',
		flexDirection: 'column-reverse'
	},
	toastWrapper: {
		pointerEvents: 'auto',
		display: 'grid',
		gridTemplateRows: '1fr',
		paddingBlockEnd: spacingVars['--spacing-3'],
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
	toastWrapperExiting: {
		gridTemplateRows: '0fr',
		paddingBlockEnd: 0
	},
	toastWrapperInner: {
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

export function toastViewportAttrs(position: ToastPosition): SvelteStyleAttrs {
	return sx(styles.viewport, positionStyle(position));
}

export function toastWrapperAttrs(isExiting: boolean): SvelteStyleAttrs {
	return sx(styles.toastWrapper, isExiting && styles.toastWrapperExiting);
}

export function toastWrapperInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.toastWrapperInner);
}
