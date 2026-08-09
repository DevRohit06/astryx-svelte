import * as stylex from '@stylexjs/stylex';
import {
	containerPaddingBlockEndVarStyles,
	containerPaddingBlockStartVarStyles,
	containerPaddingInlineVarStyles,
	paddingStyles
} from '../../internal/padding.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SpacingStep } from '../../internal/types.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import type { LayoutSlots } from './layout-slots-context.svelte.js';

/**
 * `LayoutContent`'s styles, ported from Astryx's `LayoutContent.tsx`.
 *
 * The padding model in one line: an edge that touches the container takes the
 * *outer* padding, an edge that abuts another slot takes the *inner* one — and
 * when the neighbouring header or footer has no divider, that inner padding
 * collapses to zero so the two surfaces read as one.
 *
 * That last rule is pure CSS: `when.ancestor` resolves against the marker on
 * `Layout`'s inner wrapper, and the `:has(> …)` looks at whether *its* header or
 * footer child carries `data-divider`. No JS ever learns the answer, which is
 * why the collapse also works for a header the caller rendered themselves.
 */

const styles = stylex.create({
	content: {
		boxSizing: 'border-box',
		height: '100%',
		flex: 1,
		minHeight: 0,
		overflow: 'clip',
		// Default: inner padding on all sides (will be overridden by position-specific styles)
		paddingInlineStart: `var(--layout-padding-inner-x, ${spacingVars['--spacing-4']})`,
		paddingInlineEnd: `var(--layout-padding-inner-x, ${spacingVars['--spacing-4']})`,
		paddingBlockStart: {
			default: `var(--layout-padding-inner-y, ${spacingVars['--spacing-4']})`,
			// When header has no divider, collapse top padding for seamless visual flow
			[stylex.when.ancestor(':has(> .astryx-layout-header:not([data-divider]))')]: 0
		},
		paddingBlockEnd: {
			default: `var(--layout-padding-inner-y, ${spacingVars['--spacing-4']})`,
			// When footer has no divider, collapse bottom padding for seamless visual flow
			[stylex.when.ancestor(':has(> .astryx-layout-footer:not([data-divider]))')]: 0
		},
		// Publish container padding vars for bleed children (Table, Divider, etc.)
		'--container-padding-inline-start': `var(--layout-padding-inner-x, ${spacingVars['--spacing-4']})`,
		'--container-padding-inline-end': `var(--layout-padding-inner-x, ${spacingVars['--spacing-4']})`,
		'--container-padding-block-start': `var(--layout-padding-inner-y, ${spacingVars['--spacing-4']})`,
		'--container-padding-block-end': `var(--layout-padding-inner-y, ${spacingVars['--spacing-4']})`
	},
	// When no start panel: outer-x on left edge
	noStart: {
		paddingInlineStart: `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`,
		'--container-padding-inline-start': `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`,
		'--container-padding-inline-end': `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`
	},
	// When no end panel: outer-x on right edge
	noEnd: {
		paddingInlineEnd: `var(--layout-padding-outer-x, ${spacingVars['--spacing-4']})`
	},
	// When no header: outer-y on top
	noHeader: {
		paddingBlockStart: `var(--layout-padding-outer-y, ${spacingVars['--spacing-4']})`,
		'--container-padding-block-start': `var(--layout-padding-outer-y, ${spacingVars['--spacing-4']})`
	},
	// When no footer: outer-y on bottom
	noFooter: {
		paddingBlockEnd: `var(--layout-padding-outer-y, ${spacingVars['--spacing-4']})`,
		'--container-padding-block-end': `var(--layout-padding-outer-y, ${spacingVars['--spacing-4']})`
	},
	scrollable: {
		overflow: 'auto'
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
	}
});

export interface LayoutContentAttrsOptions {
	slots: LayoutSlots;
	isScrollable: boolean;
	padding?: SpacingStep;
}

export function layoutContentAttrs(
	{
		slots: { hasHeader, hasFooter, hasStart, hasEnd },
		isScrollable,
		padding
	}: LayoutContentAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const isZeroPadding = padding === 0;

	return sx(
		styles.content,
		// Outer padding on container edges (unless content is full bleed)
		!hasStart && !isZeroPadding && padding == null && styles.noStart,
		!hasEnd && !isZeroPadding && padding == null && styles.noEnd,
		!hasHeader && !isZeroPadding && padding == null && styles.noHeader,
		!hasFooter && !isZeroPadding && padding == null && styles.noFooter,
		isScrollable && styles.scrollable,
		isZeroPadding && styles.fullBleed,
		padding != null && paddingStyles[padding],
		padding != null && containerPaddingInlineVarStyles[padding],
		padding != null && containerPaddingBlockStartVarStyles[padding],
		padding != null && containerPaddingBlockEndVarStyles[padding],
		xstyle
	);
}
