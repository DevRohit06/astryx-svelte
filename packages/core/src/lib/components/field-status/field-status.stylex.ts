import * as stylex from '@stylexjs/stylex';
import type { InputStatusType } from '../field/types.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	base: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading']
	},
	// Pulled up under the input it belongs to, so the two read as one control:
	// the negative margin overlaps the input's bottom radius and the extra block
	// padding puts the text back where it would have been.
	attached: {
		marginTop: `calc(-1 * ${spacingVars['--spacing-1-5']})`,
		paddingBlockStart: `calc(${spacingVars['--spacing-1-5']} + ${spacingVars['--spacing-2']})`,
		paddingBlockEnd: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		borderEndStartRadius: radiusVars['--radius-element'],
		borderEndEndRadius: radiusVars['--radius-element']
	},
	detached: {
		marginTop: spacingVars['--spacing-1'],
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-element']
	},
	detachedContent: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: spacingVars['--spacing-1']
	},
	detachedIcon: {
		// Center the glyph within the first text-line box so it aligns to the
		// first line of the message (rather than the top of the flex row) when the
		// message wraps to multiple lines.
		display: 'inline-flex',
		alignItems: 'center',
		height: `calc(${typeScaleVars['--text-supporting-size']} * ${typeScaleVars['--text-supporting-leading']})`,
		flexShrink: 0
	}
});

const colorStyles = stylex.create({
	warning: {
		backgroundColor: colorVars['--color-warning-muted'],
		color: colorVars['--color-text-yellow']
	},
	error: {
		backgroundColor: colorVars['--color-error-muted'],
		color: colorVars['--color-text-red']
	},
	success: {
		backgroundColor: colorVars['--color-success-muted'],
		color: colorVars['--color-text-green']
	}
});

/**
 * Extensible variant map for FieldStatus.
 *
 * A theme package adds custom variants by augmenting this interface, as
 * upstream's does:
 *
 * ```ts
 * declare module '@astryx-svelte/core' {
 *   interface FieldStatusVariantMap {
 *     inline: true;
 *   }
 * }
 * ```
 */
export interface FieldStatusVariantMap {
	attached: true;
	detached: true;
	tooltip: true;
}

export type FieldStatusVariant = keyof FieldStatusVariantMap;

export function fieldStatusAttrs(
	type: InputStatusType,
	variant: FieldStatusVariant,
	entryStyle: StyleArg,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.base,
		entryStyle,
		variant === 'attached' ? styles.attached : styles.detached,
		colorStyles[type],
		xstyle
	);
}

/** The flex row holding the `detached` variant's leading icon and its message. */
export function fieldStatusDetachedContentAttrs(): SvelteStyleAttrs {
	return sx(styles.detachedContent);
}

/** The `detached` icon's line-box, so the glyph centres on the first line. */
export function fieldStatusDetachedIconAttrs(): SvelteStyleAttrs {
	return sx(styles.detachedIcon);
}
