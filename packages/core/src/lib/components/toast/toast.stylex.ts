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

const styles = stylex.create({
	root: {
		paddingBlock: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-4'],
		borderRadius: radiusVars['--radius-container'],
		width: 400,
		maxWidth: 'min(100%, calc(100vw - 32px))',
		boxShadow: shadowVars['--shadow-med'],
		opacity: 1,
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleDefaults['--text-body-size'],
		lineHeight: typeScaleDefaults['--text-body-leading'],
		transform: 'translateY(0)',
		transitionProperty: 'opacity, transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0.01ms'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		'@starting-style': {
			opacity: 0,
			transform: 'translateY(8px)'
		}
	},
	variantDefault: {
		backgroundColor: colorVars['--color-background-inverted']
	},
	inner: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: spacingVars['--spacing-3'],
		width: '100%'
	},
	variantError: {
		backgroundColor: colorVars['--color-background-error-inverted']
	},
	content: {
		flex: 1,
		minWidth: 0
	},
	exiting: {
		opacity: 0,
		transform: 'translateY(-8px)'
	},
	endContent: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		marginBlock: `calc(${spacingVars['--spacing-1']} * -1)`,
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
