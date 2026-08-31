import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	radiusVars,
	durationVars,
	easeVars,
	shadowVars,
	typographyVars,
	typeScaleDefaults
} from '../../styles/tokens.stylex.js';

/**
 * The distance a toast drifts on entry and exit, and the fallback for
 * `--_toast-slide-y` — the variable `ToastViewport` sets on each wrapper so the
 * card enters *from* its own viewport edge. A `Toast` rendered outside a
 * viewport has no wrapper to set it, so the fallback is what it uses.
 */
const TOAST_EDGE_DRIFT = spacingVars['--spacing-2'];

const styles = stylex.create({
	root: {
		paddingBlock: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-4'],
		borderRadius: radiusVars['--radius-container'],
		boxSizing: 'border-box',
		width: 400,
		maxWidth: '100%',
		boxShadow: shadowVars['--shadow-med'],
		opacity: 'var(--_toast-swipe-opacity, 1)',
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleDefaults['--text-body-size'],
		lineHeight: typeScaleDefaults['--text-body-leading'],
		transform: 'translateY(var(--_toast-swipe-y, 0px)) scale(var(--_toast-swipe-scale, 1))',
		transitionProperty: 'opacity, transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0.01ms'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		'@starting-style': {
			opacity: 0,
			transform: `translateY(var(--_toast-slide-y, ${TOAST_EDGE_DRIFT}))`
		}
	},
	variantDefault: {
		backgroundColor: colorVars['--color-background-inverted']
	},

	inner: {
		display: 'flex',
		alignItems: 'flex-start',
		flexWrap: 'nowrap',
		gap: spacingVars['--spacing-3'],
		width: '100%'
	},
	variantError: {
		backgroundColor: colorVars['--color-background-error-inverted']
	},
	content: {
		flex: 1,
		minWidth: 0,
		overflowWrap: 'anywhere'
	},
	exiting: {
		opacity: 0,
		transform: `translateY(var(--_toast-swipe-exit-y, var(--_toast-swipe-y, var(--_toast-slide-y, ${TOAST_EDGE_DRIFT})))) scale(var(--_toast-swipe-scale, 1))`
	},
	endContent: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		// Keep every trailing control centered on the first 20px body line, even
		// when the body wraps or a consumer supplies a control taller than the
		// built-in 28px dismiss button. The action label should still stay short;
		// the wrappers above let it break rather than widen the Toast.
		blockSize: `calc(${typeScaleDefaults['--text-body-size']} * ${typeScaleDefaults['--text-body-leading']})`,
		marginInlineEnd: `calc(${spacingVars['--spacing-1']} * -1)`
	}
});

/**
 * `ToastProps` does not extend `BaseProps` upstream — it is a closed list with
 * no `class`/`style`/`xstyle` — so there is deliberately no override argument
 * here. A toast is only ever constructed by `ToastViewport` from `ToastOptions`.
 */
export function toastRootAttrs(isError: boolean, isExiting: boolean): SvelteStyleAttrs {
	return sx(
		styles.root,
		isError ? styles.variantError : styles.variantDefault,
		isExiting && styles.exiting
	);
}

export function toastInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.inner);
}

export function toastContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}

export function toastEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.endContent);
}
