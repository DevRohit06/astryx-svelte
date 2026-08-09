import * as stylex from '@stylexjs/stylex';
import { borderVars, colorVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * Extensible variant map for Divider.
 *
 * Theme packages add their own variants by augmenting this interface, exactly
 * as upstream:
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface DividerVariantMap {
 *     accent: true;
 *   }
 * }
 */
export interface DividerVariantMap {
	subtle: true;
	strong: true;
}

/** Visual weight of the rule. Extensible via `DividerVariantMap`. */
export type DividerVariant = keyof DividerVariantMap;

export type DividerOrientation = 'horizontal' | 'vertical';

const baseStyles = stylex.create({
	horizontal: {
		display: 'flex',
		alignItems: 'center',
		width: '100%'
	},
	vertical: {
		display: 'inline-flex',
		flexDirection: 'column',
		alignItems: 'center',
		height: '100%'
	}
});

const lineStyles = stylex.create({
	horizontalLine: {
		height: borderVars['--border-width'],
		flexGrow: 1,
		flexShrink: 1
	},
	verticalLine: {
		width: borderVars['--border-width'],
		flexGrow: 1,
		flexShrink: 1
	},
	subtle: {
		backgroundColor: colorVars['--color-border']
	},
	strong: {
		backgroundColor: colorVars['--color-border-emphasized']
	}
});

const labelStyles = stylex.create({
	label: {
		flexShrink: 0,
		paddingInline: spacingVars['--spacing-3'],
		// Small secondary text styling
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	verticalLabel: {
		paddingInline: 0,
		paddingBlock: spacingVars['--spacing-3']
	}
});

// The container padding vars are published by whichever ancestor set the
// padding, so a full-bleed divider can cancel it without knowing the value.
const fullBleedStyles = stylex.create({
	horizontal: {
		marginInlineStart: 'calc(-1 * var(--container-padding-inline-start, 0px))',
		marginInlineEnd: 'calc(-1 * var(--container-padding-inline-end, 0px))',
		width:
			'calc(100% + var(--container-padding-inline-start, 0px) + var(--container-padding-inline-end, 0px))'
	},
	vertical: {
		marginBlockStart: 'calc(-1 * var(--container-padding-block-start, 0px))',
		marginBlockEnd: 'calc(-1 * var(--container-padding-block-end, 0px))',
		height:
			'calc(100% + var(--container-padding-block-start, 0px) + var(--container-padding-block-end, 0px))'
	}
});

export function dividerRootAttrs(
	orientation: DividerOrientation,
	isFullBleed: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const isHorizontal = orientation === 'horizontal';

	return sx(
		isHorizontal ? baseStyles.horizontal : baseStyles.vertical,
		isFullBleed && (isHorizontal ? fullBleedStyles.horizontal : fullBleedStyles.vertical),
		xstyle
	);
}

export function dividerLineAttrs(
	orientation: DividerOrientation,
	variant: DividerVariant
): SvelteStyleAttrs {
	return sx(
		orientation === 'horizontal' ? lineStyles.horizontalLine : lineStyles.verticalLine,
		lineStyles[variant as 'subtle' | 'strong']
	);
}

export function dividerLabelAttrs(orientation: DividerOrientation): SvelteStyleAttrs {
	return sx(labelStyles.label, orientation !== 'horizontal' && labelStyles.verticalLabel);
}
