import * as stylex from '@stylexjs/stylex';
import {
	containerPaddingBlockEndVarStyles,
	containerPaddingBlockStartVarStyles,
	containerPaddingInlineVarStyles,
	paddingStyles
} from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SizeValue, SpacingStep } from '../../internal/types.js';
import { colorVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * `LayoutFooter`'s two elements, ported from Astryx's `LayoutFooter.tsx`.
 *
 * The mirror image of the header: the divider sits on the block-*start* edge,
 * and the inner padding is on the top rather than the bottom, since that is the
 * edge facing the content.
 */

const styles = stylex.create({
	// Outer shell: owns border/divider and sizing. No padding — that lives on inner.
	footer: {
		flexShrink: 0
	},
	// Inner wrapper: owns padding and optional content-width constraint.
	// When --layout-content-width is not set, maxWidth defaults to 'none' (inert).
	inner: {
		boxSizing: 'border-box',
		maxWidth: 'var(--layout-content-width, none)',
		marginInline: 'auto',
		// Default: outer padding on edges that touch container, inner on interior edges
		paddingInlineStart: `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`,
		paddingInlineEnd: `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`,
		paddingBlockStart: `var(--layout-padding-inner-y, ${spacingVars['--spacing-4']})`,
		paddingBlockEnd: `var(--layout-padding-outer-y, ${spacingVars['--spacing-4']})`,
		'--container-padding-inline-start': `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`,
		'--container-padding-inline-end': `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`,
		'--container-padding-block-start': `var(--layout-padding-inner-y, ${spacingVars['--spacing-4']})`,
		'--container-padding-block-end': `var(--layout-padding-outer-y, ${spacingVars['--spacing-4']})`
	},
	fullBleed: {
		paddingInlineStart: 0,
		paddingInlineEnd: 0,
		paddingBlockStart: 0,
		paddingBlockEnd: 0,
		'--container-padding-inline-start': '0px',
		'--container-padding-inline-end': '0px',
		'--container-padding-block-start': '0px',
		'--container-padding-block-end': '0px'
	},
	divider: {
		borderBlockStartWidth: 1,
		borderBlockStartStyle: 'solid',
		borderBlockStartColor: colorVars['--color-border']
	}
});

const dynamicStyles = stylex.create({
	sizing: (height: SizeValue | null) => ({
		height
	})
});

export function layoutFooterAttrs(
	height: SizeValue | undefined,
	hasDivider: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.footer,
		dynamicStyles.sizing(height ?? null),
		hasDivider && styles.divider,
		xstyle
	);
}

export function layoutFooterInnerAttrs(padding: SpacingStep | undefined): SvelteStyleAttrs {
	return sx(
		styles.inner,
		padding === 0 && styles.fullBleed,
		padding != null && paddingStyles[padding],
		padding != null && containerPaddingInlineVarStyles[padding],
		padding != null && containerPaddingBlockStartVarStyles[padding],
		padding != null && containerPaddingBlockEndVarStyles[padding]
	);
}
