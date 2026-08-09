import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

export type CitationVariant = 'label' | 'number';

const styles = stylex.create({
	label: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		verticalAlign: 'baseline',
		height: spacingVars['--spacing-5'],
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: typeScaleVars['--text-supporting-weight'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		borderRadius: radiusVars['--radius-element'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: colorVars['--color-border'],
		paddingInline: spacingVars['--spacing-2'],
		marginInlineStart: spacingVars['--spacing-0-5'],
		textDecoration: 'none',
		transitionProperty: 'background-color, border-color, color',
		transitionDuration: durationVars['--duration-fast-max'],
		transitionTimingFunction: easeVars['--ease-standard'],
		maxWidth: '15em',
		overflow: 'hidden'
	},
	labelWithIcon: {
		paddingInlineStart: spacingVars['--spacing-0-5']
	},
	labelText: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		minWidth: 0
	},
	labelInteractive: {
		cursor: 'pointer'
	},
	labelHover: {
		backgroundColor: {
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		color: {
			// Explicit default: without it, this hover-only conditional replaces
			// the base secondary colour from `label` (last-wins property merge),
			// leaving linked citations to inherit the surrounding text colour.
			default: colorVars['--color-text-secondary'],
			':hover': {
				'@media (hover: hover)': colorVars['--color-text-primary']
			}
		}
	},
	number: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		verticalAlign: 'super',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		backgroundColor: colorVars['--color-accent-muted'],
		borderRadius: radiusVars['--radius-full'],
		minWidth: spacingVars['--spacing-5'],
		height: spacingVars['--spacing-5'],
		paddingInline: spacingVars['--spacing-1'],
		textDecoration: 'none',
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast-max'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	numberInteractive: {
		cursor: 'pointer'
	},
	numberHover: {
		backgroundColor: {
			// Explicit default for the same reason as labelHover's colour: a
			// hover-only conditional replaces the base accent-muted pill from
			// `number` on merge, leaving linked badges transparent.
			default: colorVars['--color-accent-muted'],
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		}
	},
	iconWrap: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: spacingVars['--spacing-4'],
		height: spacingVars['--spacing-4'],
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: colorVars['--color-background-surface'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: colorVars['--color-border'],
		overflow: 'hidden',
		flexShrink: 0
	},
	icon: {
		width: spacingVars['--spacing-3'],
		height: spacingVars['--spacing-3']
	}
});

export function citationRootAttrs(
	variant: CitationVariant,
	hasIcon: boolean,
	hasHref: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	if (variant === 'number') {
		return sx(
			styles.number,
			hasHref && styles.numberHover,
			hasHref && styles.numberInteractive,
			xstyle
		);
	}
	return sx(
		styles.label,
		hasIcon && styles.labelWithIcon,
		hasHref && styles.labelHover,
		hasHref && styles.labelInteractive,
		xstyle
	);
}

export function citationLabelTextAttrs(): SvelteStyleAttrs {
	return sx(styles.labelText);
}

export function citationIconWrapAttrs(): SvelteStyleAttrs {
	return sx(styles.iconWrap);
}

export function citationIconAttrs(): SvelteStyleAttrs {
	return sx(styles.icon);
}
