import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	fontWeightVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `Outline/Outline.tsx` styles.
 *
 * The sliding indicator is **CSS anchor positioning**, not a measured
 * transform: the active link carries `anchor-name: --outline-active` and the
 * indicator resolves `top`/`height` against it, so the browser animates the bar
 * with no JavaScript measurement at all. Two consequences worth knowing — the
 * anchor name is a **literal**, not per-instance (see the note in
 * `outline.svelte`), and the name lives in a StyleX *class* rather than an
 * inline style, so the `anchor-name`-clobbering hazard `useLayer.attachTrigger`
 * repairs cannot arise here.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'row',
		position: 'relative',
		gap: spacingVars['--spacing-0-5'],
		width: '100%'
	},
	track: {
		position: 'relative',
		width: '2px',
		flexShrink: 0,
		order: -1
	},
	dividerLine: {
		position: 'absolute',
		insetBlockStart: 0,
		insetBlockEnd: 0,
		insetInlineStart: 0,
		width: '2px',
		backgroundColor: colorVars['--color-border'],
		borderRadius: radiusVars['--radius-full'],
		pointerEvents: 'none'
	},
	indicator: {
		position: 'absolute',
		insetInlineStart: 0,
		width: '2px',
		backgroundColor: colorVars['--color-icon-primary'],
		borderRadius: radiusVars['--radius-full'],
		pointerEvents: 'none',
		zIndex: 1,
		positionAnchor: '--outline-active',
		top: 'anchor(--outline-active top, 0px)',
		height: 'anchor-size(--outline-active height, 0px)',
		transitionProperty: 'top, height',
		transitionDuration: durationVars['--duration-fast-min'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	activeAnchor: {
		anchorName: '--outline-active'
	},
	list: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		margin: 0,
		padding: 0,
		listStyle: 'none',
		flex: 1,
		minWidth: 0
	},
	item: {
		listStyleType: 'none',
		margin: 0,
		padding: 0
	},
	link: {
		alignItems: 'center',
		borderRadius: radiusVars['--radius-element'],
		boxSizing: 'border-box',
		color: colorVars['--color-text-secondary'],
		cursor: 'pointer',
		display: 'flex',
		fontWeight: fontWeightVars['--font-weight-normal'],
		outline: 'none',
		position: 'relative',
		textAlign: 'start',
		textDecoration: 'none',
		transitionDuration: durationVars['--duration-fast'],
		transitionProperty: 'background-color, color',
		transitionTimingFunction: easeVars['--ease-standard'],
		width: '100%',
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		':hover': {
			'@media (hover: hover)': {
				backgroundColor: colorVars['--color-overlay-hover'],
				color: colorVars['--color-text-primary']
			}
		},
		':active': {
			backgroundColor: colorVars['--color-overlay-pressed']
		}
	},
	activeLink: {
		color: colorVars['--color-text-primary'],
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	label: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	}
});

const densityStyles = stylex.create({
	compact: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInlineEnd: spacingVars['--spacing-2']
	},
	default: {
		paddingBlock: spacingVars['--spacing-2'],
		paddingInlineEnd: spacingVars['--spacing-2']
	}
});

const indentStyles = stylex.create({
	level1: { paddingInlineStart: spacingVars['--spacing-3'] },
	level2: { paddingInlineStart: spacingVars['--spacing-7'] },
	level3: { paddingInlineStart: spacingVars['--spacing-11'] },
	level4: { paddingInlineStart: spacingVars['--spacing-12'] }
});

/** Density variant controlling item padding. */
export type OutlineDensity = 'default' | 'compact';

function getIndentStyle(level: number) {
	// Map heading levels 1-6 to visual indent levels 1-4
	// Level 1 (h1) = indent 1, Level 2 (h2) = indent 1, Level 3 (h3) = indent 2, etc.
	const indentLevel = Math.max(1, Math.min(4, level - 1 || 1));
	switch (indentLevel) {
		case 1:
			return indentStyles.level1;
		case 2:
			return indentStyles.level2;
		case 3:
			return indentStyles.level3;
		default:
			return indentStyles.level4;
	}
}

/** The `<nav>` landmark. */
export function outlineRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The `<ul>` holding the items. */
export function outlineListAttrs(): SvelteStyleAttrs {
	return sx(styles.list);
}

/** Each `<li>`. */
export function outlineItemAttrs(): SvelteStyleAttrs {
	return sx(styles.item);
}

/** The anchor inside each item. Carries the anchor name while active. */
export function outlineLinkAttrs(
	density: OutlineDensity,
	level: number,
	isActive: boolean
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.link,
		densityStyles[density],
		getIndentStyle(level),
		isActive && styles.activeLink,
		isActive && styles.activeAnchor
	);
}

/** The label span, which ellipsises. */
export function outlineLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.label);
}

/** The track column holding the divider line. */
export function outlineTrackAttrs(): SvelteStyleAttrs {
	return sx(styles.track);
}

/** The static divider line inside the track. */
export function outlineDividerLineAttrs(): SvelteStyleAttrs {
	return sx(styles.dividerLine);
}

/** The sliding active-item bar. */
export function outlineIndicatorAttrs(): SvelteStyleAttrs {
	return sx(styles.indicator);
}
