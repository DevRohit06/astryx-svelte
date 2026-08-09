import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '../styles/tokens.stylex.js';
import type { SpacingStep } from './types.js';
import type { SpacingToken } from './container.stylex.js';

/**
 * Padding on the spacing scale, ported from Astryx's
 * `src/Layout/padding.stylex.ts`.
 *
 * Everything `Stack`, `Card`, `Layout` and `Section` need is here, including
 * `sectionPaddingPropagationStyles` — the token a `Section` publishes so nested
 * sections inherit its padding.
 */

/** Bridges the numeric prop scale to the token keys the container system uses. */
export const spacingStepToToken: Record<SpacingStep, SpacingToken> = {
	0: 'spacing0',
	0.5: 'spacing0_5',
	1: 'spacing1',
	1.5: 'spacing1_5',
	2: 'spacing2',
	3: 'spacing3',
	4: 'spacing4',
	5: 'spacing5',
	6: 'spacing6',
	8: 'spacing8',
	10: 'spacing10'
};

/** Uniform padding on all four sides. */
export const paddingStyles = stylex.create({
	0: {
		paddingInlineStart: spacingVars['--spacing-0'],
		paddingInlineEnd: spacingVars['--spacing-0'],
		paddingBlockStart: spacingVars['--spacing-0'],
		paddingBlockEnd: spacingVars['--spacing-0']
	},
	0.5: {
		paddingInlineStart: spacingVars['--spacing-0-5'],
		paddingInlineEnd: spacingVars['--spacing-0-5'],
		paddingBlockStart: spacingVars['--spacing-0-5'],
		paddingBlockEnd: spacingVars['--spacing-0-5']
	},
	1: {
		paddingInlineStart: spacingVars['--spacing-1'],
		paddingInlineEnd: spacingVars['--spacing-1'],
		paddingBlockStart: spacingVars['--spacing-1'],
		paddingBlockEnd: spacingVars['--spacing-1']
	},
	1.5: {
		paddingInlineStart: spacingVars['--spacing-1-5'],
		paddingInlineEnd: spacingVars['--spacing-1-5'],
		paddingBlockStart: spacingVars['--spacing-1-5'],
		paddingBlockEnd: spacingVars['--spacing-1-5']
	},
	2: {
		paddingInlineStart: spacingVars['--spacing-2'],
		paddingInlineEnd: spacingVars['--spacing-2'],
		paddingBlockStart: spacingVars['--spacing-2'],
		paddingBlockEnd: spacingVars['--spacing-2']
	},
	3: {
		paddingInlineStart: spacingVars['--spacing-3'],
		paddingInlineEnd: spacingVars['--spacing-3'],
		paddingBlockStart: spacingVars['--spacing-3'],
		paddingBlockEnd: spacingVars['--spacing-3']
	},
	4: {
		paddingInlineStart: spacingVars['--spacing-4'],
		paddingInlineEnd: spacingVars['--spacing-4'],
		paddingBlockStart: spacingVars['--spacing-4'],
		paddingBlockEnd: spacingVars['--spacing-4']
	},
	5: {
		paddingInlineStart: spacingVars['--spacing-5'],
		paddingInlineEnd: spacingVars['--spacing-5'],
		paddingBlockStart: spacingVars['--spacing-5'],
		paddingBlockEnd: spacingVars['--spacing-5']
	},
	6: {
		paddingInlineStart: spacingVars['--spacing-6'],
		paddingInlineEnd: spacingVars['--spacing-6'],
		paddingBlockStart: spacingVars['--spacing-6'],
		paddingBlockEnd: spacingVars['--spacing-6']
	},
	8: {
		paddingInlineStart: spacingVars['--spacing-8'],
		paddingInlineEnd: spacingVars['--spacing-8'],
		paddingBlockStart: spacingVars['--spacing-8'],
		paddingBlockEnd: spacingVars['--spacing-8']
	},
	10: {
		paddingInlineStart: spacingVars['--spacing-10'],
		paddingInlineEnd: spacingVars['--spacing-10'],
		paddingBlockStart: spacingVars['--spacing-10'],
		paddingBlockEnd: spacingVars['--spacing-10']
	}
});

/**
 * Publishes `--container-padding-inline-*` so edge-compensating children know
 * the inline padding they have to cancel.
 */
export const containerPaddingInlineVarStyles = stylex.create({
	0: {
		'--container-padding-inline-start': spacingVars['--spacing-0'],
		'--container-padding-inline-end': spacingVars['--spacing-0']
	},
	0.5: {
		'--container-padding-inline-start': spacingVars['--spacing-0-5'],
		'--container-padding-inline-end': spacingVars['--spacing-0-5']
	},
	1: {
		'--container-padding-inline-start': spacingVars['--spacing-1'],
		'--container-padding-inline-end': spacingVars['--spacing-1']
	},
	1.5: {
		'--container-padding-inline-start': spacingVars['--spacing-1-5'],
		'--container-padding-inline-end': spacingVars['--spacing-1-5']
	},
	2: {
		'--container-padding-inline-start': spacingVars['--spacing-2'],
		'--container-padding-inline-end': spacingVars['--spacing-2']
	},
	3: {
		'--container-padding-inline-start': spacingVars['--spacing-3'],
		'--container-padding-inline-end': spacingVars['--spacing-3']
	},
	4: {
		'--container-padding-inline-start': spacingVars['--spacing-4'],
		'--container-padding-inline-end': spacingVars['--spacing-4']
	},
	5: {
		'--container-padding-inline-start': spacingVars['--spacing-5'],
		'--container-padding-inline-end': spacingVars['--spacing-5']
	},
	6: {
		'--container-padding-inline-start': spacingVars['--spacing-6'],
		'--container-padding-inline-end': spacingVars['--spacing-6']
	},
	8: {
		'--container-padding-inline-start': spacingVars['--spacing-8'],
		'--container-padding-inline-end': spacingVars['--spacing-8']
	},
	10: {
		'--container-padding-inline-start': spacingVars['--spacing-10'],
		'--container-padding-inline-end': spacingVars['--spacing-10']
	}
});

/**
 * Publishes `--container-padding-block-start` for children that bleed past the
 * top edge — a Table, Divider or Section sitting first in the container.
 */
export const containerPaddingBlockStartVarStyles = stylex.create({
	0: { '--container-padding-block-start': spacingVars['--spacing-0'] },
	0.5: { '--container-padding-block-start': spacingVars['--spacing-0-5'] },
	1: { '--container-padding-block-start': spacingVars['--spacing-1'] },
	1.5: { '--container-padding-block-start': spacingVars['--spacing-1-5'] },
	2: { '--container-padding-block-start': spacingVars['--spacing-2'] },
	3: { '--container-padding-block-start': spacingVars['--spacing-3'] },
	4: { '--container-padding-block-start': spacingVars['--spacing-4'] },
	5: { '--container-padding-block-start': spacingVars['--spacing-5'] },
	6: { '--container-padding-block-start': spacingVars['--spacing-6'] },
	8: { '--container-padding-block-start': spacingVars['--spacing-8'] },
	10: { '--container-padding-block-start': spacingVars['--spacing-10'] }
});

/** The block-end half of the same contract. */
export const containerPaddingBlockEndVarStyles = stylex.create({
	0: { '--container-padding-block-end': spacingVars['--spacing-0'] },
	0.5: { '--container-padding-block-end': spacingVars['--spacing-0-5'] },
	1: { '--container-padding-block-end': spacingVars['--spacing-1'] },
	1.5: { '--container-padding-block-end': spacingVars['--spacing-1-5'] },
	2: { '--container-padding-block-end': spacingVars['--spacing-2'] },
	3: { '--container-padding-block-end': spacingVars['--spacing-3'] },
	4: { '--container-padding-block-end': spacingVars['--spacing-4'] },
	5: { '--container-padding-block-end': spacingVars['--spacing-5'] },
	6: { '--container-padding-block-end': spacingVars['--spacing-6'] },
	8: { '--container-padding-block-end': spacingVars['--spacing-8'] },
	10: { '--container-padding-block-end': spacingVars['--spacing-10'] }
});

/**
 * Publishes `--layout-padding-outer-x`, which every `Layout` slot reads for the
 * edge that touches the container.
 */
export const layoutPaddingOuterXVarStyles = stylex.create({
	0: { '--layout-padding-outer-x': spacingVars['--spacing-0'] },
	0.5: { '--layout-padding-outer-x': spacingVars['--spacing-0-5'] },
	1: { '--layout-padding-outer-x': spacingVars['--spacing-1'] },
	1.5: { '--layout-padding-outer-x': spacingVars['--spacing-1-5'] },
	2: { '--layout-padding-outer-x': spacingVars['--spacing-2'] },
	3: { '--layout-padding-outer-x': spacingVars['--spacing-3'] },
	4: { '--layout-padding-outer-x': spacingVars['--spacing-4'] },
	5: { '--layout-padding-outer-x': spacingVars['--spacing-5'] },
	6: { '--layout-padding-outer-x': spacingVars['--spacing-6'] },
	8: { '--layout-padding-outer-x': spacingVars['--spacing-8'] },
	10: { '--layout-padding-outer-x': spacingVars['--spacing-10'] }
});

/** The block half of the same contract. */
export const layoutPaddingOuterYVarStyles = stylex.create({
	0: { '--layout-padding-outer-y': spacingVars['--spacing-0'] },
	0.5: { '--layout-padding-outer-y': spacingVars['--spacing-0-5'] },
	1: { '--layout-padding-outer-y': spacingVars['--spacing-1'] },
	1.5: { '--layout-padding-outer-y': spacingVars['--spacing-1-5'] },
	2: { '--layout-padding-outer-y': spacingVars['--spacing-2'] },
	3: { '--layout-padding-outer-y': spacingVars['--spacing-3'] },
	4: { '--layout-padding-outer-y': spacingVars['--spacing-4'] },
	5: { '--layout-padding-outer-y': spacingVars['--spacing-5'] },
	6: { '--layout-padding-outer-y': spacingVars['--spacing-6'] },
	8: { '--layout-padding-outer-y': spacingVars['--spacing-8'] },
	10: { '--layout-padding-outer-y': spacingVars['--spacing-10'] }
});

/**
 * Inline-only padding. Used by `Stack`'s `paddingInline` prop, which overrides
 * `padding` on the inline axis.
 */
export const paddingInlineStyles = stylex.create({
	0: {
		paddingInlineStart: spacingVars['--spacing-0'],
		paddingInlineEnd: spacingVars['--spacing-0']
	},
	0.5: {
		paddingInlineStart: spacingVars['--spacing-0-5'],
		paddingInlineEnd: spacingVars['--spacing-0-5']
	},
	1: {
		paddingInlineStart: spacingVars['--spacing-1'],
		paddingInlineEnd: spacingVars['--spacing-1']
	},
	1.5: {
		paddingInlineStart: spacingVars['--spacing-1-5'],
		paddingInlineEnd: spacingVars['--spacing-1-5']
	},
	2: {
		paddingInlineStart: spacingVars['--spacing-2'],
		paddingInlineEnd: spacingVars['--spacing-2']
	},
	3: {
		paddingInlineStart: spacingVars['--spacing-3'],
		paddingInlineEnd: spacingVars['--spacing-3']
	},
	4: {
		paddingInlineStart: spacingVars['--spacing-4'],
		paddingInlineEnd: spacingVars['--spacing-4']
	},
	5: {
		paddingInlineStart: spacingVars['--spacing-5'],
		paddingInlineEnd: spacingVars['--spacing-5']
	},
	6: {
		paddingInlineStart: spacingVars['--spacing-6'],
		paddingInlineEnd: spacingVars['--spacing-6']
	},
	8: {
		paddingInlineStart: spacingVars['--spacing-8'],
		paddingInlineEnd: spacingVars['--spacing-8']
	},
	10: {
		paddingInlineStart: spacingVars['--spacing-10'],
		paddingInlineEnd: spacingVars['--spacing-10']
	}
});

/**
 * Publishes `--astryx-section-padding` so a nested `Section` inherits its
 * parent's padding through the container cascade. `Section` sets this whenever
 * it has an explicit `padding` — including `padding={4}` — so descendants read
 * the same value even when the concrete padding styles are skipped as the token
 * default.
 */
export const sectionPaddingPropagationStyles = stylex.create({
	0: { '--astryx-section-padding': spacingVars['--spacing-0'] },
	0.5: { '--astryx-section-padding': spacingVars['--spacing-0-5'] },
	1: { '--astryx-section-padding': spacingVars['--spacing-1'] },
	1.5: { '--astryx-section-padding': spacingVars['--spacing-1-5'] },
	2: { '--astryx-section-padding': spacingVars['--spacing-2'] },
	3: { '--astryx-section-padding': spacingVars['--spacing-3'] },
	4: { '--astryx-section-padding': spacingVars['--spacing-4'] },
	5: { '--astryx-section-padding': spacingVars['--spacing-5'] },
	6: { '--astryx-section-padding': spacingVars['--spacing-6'] },
	8: { '--astryx-section-padding': spacingVars['--spacing-8'] },
	10: { '--astryx-section-padding': spacingVars['--spacing-10'] }
});

/**
 * Block-only padding. Used by `Stack`'s `paddingBlock` prop, which overrides
 * `padding` on the block axis.
 */
export const paddingBlockStyles = stylex.create({
	0: {
		paddingBlockStart: spacingVars['--spacing-0'],
		paddingBlockEnd: spacingVars['--spacing-0']
	},
	0.5: {
		paddingBlockStart: spacingVars['--spacing-0-5'],
		paddingBlockEnd: spacingVars['--spacing-0-5']
	},
	1: {
		paddingBlockStart: spacingVars['--spacing-1'],
		paddingBlockEnd: spacingVars['--spacing-1']
	},
	1.5: {
		paddingBlockStart: spacingVars['--spacing-1-5'],
		paddingBlockEnd: spacingVars['--spacing-1-5']
	},
	2: {
		paddingBlockStart: spacingVars['--spacing-2'],
		paddingBlockEnd: spacingVars['--spacing-2']
	},
	3: {
		paddingBlockStart: spacingVars['--spacing-3'],
		paddingBlockEnd: spacingVars['--spacing-3']
	},
	4: {
		paddingBlockStart: spacingVars['--spacing-4'],
		paddingBlockEnd: spacingVars['--spacing-4']
	},
	5: {
		paddingBlockStart: spacingVars['--spacing-5'],
		paddingBlockEnd: spacingVars['--spacing-5']
	},
	6: {
		paddingBlockStart: spacingVars['--spacing-6'],
		paddingBlockEnd: spacingVars['--spacing-6']
	},
	8: {
		paddingBlockStart: spacingVars['--spacing-8'],
		paddingBlockEnd: spacingVars['--spacing-8']
	},
	10: {
		paddingBlockStart: spacingVars['--spacing-10'],
		paddingBlockEnd: spacingVars['--spacing-10']
	}
});
