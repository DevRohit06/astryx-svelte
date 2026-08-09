import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from the `styles` block in Astryx's `Chat/ChatLayoutScrollButton.tsx`.
 *
 * `button` redefines `--radius-element` *as a property* rather than reading it
 * — upstream's `[radiusVars['--radius-element'] as string]: radiusVars['--radius-full']`
 * — so `Button`'s own compiled radius resolves to the full pill inside this
 * container without overriding the declaration itself. The cast is upstream's
 * and is required: a computed key must be a string.
 */
const styles = stylex.create({
	wrapper: {
		display: 'flex',
		justifyContent: 'center',
		paddingBlockEnd: spacingVars['--spacing-3']
	},
	container: {
		pointerEvents: 'auto',
		contain: 'layout style',
		overflow: 'hidden',
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: colorVars['--color-background-popover'],
		boxShadow: shadowVars['--shadow-med'],
		height: '32px',
		transitionProperty: 'opacity, transform, max-width',
		transitionTimingFunction: easeVars['--ease-standard'],
		transitionDuration: {
			default: durationVars['--duration-fast-max'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		}
	},
	hidden: {
		opacity: 0,
		pointerEvents: 'none',
		maxWidth: '32px'
	},
	visible: {
		opacity: 1,
		pointerEvents: 'auto'
	},
	collapsed: {
		maxWidth: '32px'
	},
	expanded: {
		maxWidth: '200px'
	},
	button: {
		[radiusVars['--radius-element'] as string]: radiusVars['--radius-full'],
		whiteSpace: 'nowrap',
		paddingInline: spacingVars['--spacing-2']
	},
	// When a label is shown, the icon sits on the leading edge and the text on
	// the trailing edge. Symmetric padding leaves the text cramped against the
	// pill's rounded edge, so give the trailing side extra breathing room.
	buttonWithLabel: {
		paddingInlineEnd: spacingVars['--spacing-3']
	}
});

export function scrollButtonWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}

export function scrollButtonContainerAttrs(
	isVisible: boolean,
	hasLabel: boolean
): SvelteStyleAttrs {
	return sx(
		styles.container,
		isVisible ? styles.visible : styles.hidden,
		hasLabel ? styles.expanded : styles.collapsed
	);
}

export function scrollButtonStyle(hasLabel: boolean): StyleArg[] {
	return [styles.button, hasLabel ? styles.buttonWithLabel : null];
}
