import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SpacingStep } from '../../internal/types.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/** Alignment for `align-items` / `justify-items` on the grid. */
export type GridAlignment = 'start' | 'center' | 'end' | 'stretch';

/**
 * Column configuration.
 *
 * - `number` — that many equal-width columns.
 * - object — responsive columns sized from a minimum child width:
 *   - `minWidth` — minimum width, in pixels, of each column track
 *   - `repeat` — `'fill'` (default) keeps empty tracks so widths stay
 *     consistent; `'fit'` collapses them so items stretch
 *   - `max` — caps the column *count*. The grid still stretches to 100% of its
 *     parent and present columns fill the row, so a layout collapsing to one
 *     column on mobile has no dead space on the right.
 */
export type GridColumns =
	| number
	| {
			minWidth: number;
			max?: number;
			repeat?: 'fill' | 'fit';
	  };

const baseStyles = stylex.create({
	grid: {
		display: 'grid'
	}
});

// Dynamic track values compile to a CSS variable plus a class-level declaration
// (`grid-template-columns: var(--x)`) rather than a raw inline style, so a
// consumer's overrides — including ones inside @media queries — can still win.
// A raw inline `grid-template-columns` would beat any class.
const dynamicStyles = stylex.create({
	templateColumns: (value: string) => ({
		gridTemplateColumns: value
	}),
	autoRows: (value: number) => ({
		gridAutoRows: `${value}px`
	})
});

const alignStyles = stylex.create({
	start: {
		alignItems: 'start'
	},
	center: {
		alignItems: 'center'
	},
	end: {
		alignItems: 'end'
	},
	stretch: {
		alignItems: 'stretch'
	}
});

const justifyStyles = stylex.create({
	start: {
		justifyItems: 'start'
	},
	center: {
		justifyItems: 'center'
	},
	end: {
		justifyItems: 'end'
	},
	stretch: {
		justifyItems: 'stretch'
	}
});

const gapStyles = stylex.create({
	0: { gap: spacingVars['--spacing-0'] },
	0.5: { gap: spacingVars['--spacing-0-5'] },
	1: { gap: spacingVars['--spacing-1'] },
	1.5: { gap: spacingVars['--spacing-1-5'] },
	2: { gap: spacingVars['--spacing-2'] },
	3: { gap: spacingVars['--spacing-3'] },
	4: { gap: spacingVars['--spacing-4'] },
	5: { gap: spacingVars['--spacing-5'] },
	6: { gap: spacingVars['--spacing-6'] },
	8: { gap: spacingVars['--spacing-8'] },
	10: { gap: spacingVars['--spacing-10'] }
});

const rowGapStyles = stylex.create({
	0: { rowGap: spacingVars['--spacing-0'] },
	0.5: { rowGap: spacingVars['--spacing-0-5'] },
	1: { rowGap: spacingVars['--spacing-1'] },
	1.5: { rowGap: spacingVars['--spacing-1-5'] },
	2: { rowGap: spacingVars['--spacing-2'] },
	3: { rowGap: spacingVars['--spacing-3'] },
	4: { rowGap: spacingVars['--spacing-4'] },
	5: { rowGap: spacingVars['--spacing-5'] },
	6: { rowGap: spacingVars['--spacing-6'] },
	8: { rowGap: spacingVars['--spacing-8'] },
	10: { rowGap: spacingVars['--spacing-10'] }
});

const columnGapStyles = stylex.create({
	0: { columnGap: spacingVars['--spacing-0'] },
	0.5: { columnGap: spacingVars['--spacing-0-5'] },
	1: { columnGap: spacingVars['--spacing-1'] },
	1.5: { columnGap: spacingVars['--spacing-1-5'] },
	2: { columnGap: spacingVars['--spacing-2'] },
	3: { columnGap: spacingVars['--spacing-3'] },
	4: { columnGap: spacingVars['--spacing-4'] },
	5: { columnGap: spacingVars['--spacing-5'] },
	6: { columnGap: spacingVars['--spacing-6'] },
	8: { columnGap: spacingVars['--spacing-8'] },
	10: { columnGap: spacingVars['--spacing-10'] }
});

/** Token names, for the gap term inside a track-max expression. */
const spacingVarNames: Record<SpacingStep, string> = {
	0: '--spacing-0',
	0.5: '--spacing-0-5',
	1: '--spacing-1',
	1.5: '--spacing-1-5',
	2: '--spacing-2',
	3: '--spacing-3',
	4: '--spacing-4',
	5: '--spacing-5',
	6: '--spacing-6',
	8: '--spacing-8',
	10: '--spacing-10'
};

/**
 * Build a `grid-template-columns` value that caps the column *count* at `max`
 * while still letting the columns actually present stretch to fill the row.
 *
 * The cap lives on the track's **min** size, not its max: each track is at
 * least `perColumn = (100% - (max - 1) * gap) / max`, so more than `max`
 * columns can never fit. The track **max** stays `1fr`, so whenever fewer than
 * `max` columns fit — most importantly a lone column on mobile — they still
 * grow to fill the row.
 *
 * The track min is `max(minWidth, perColumn)` so an explicit `minWidth` is
 * still honoured, wrapped in `min(100%, …)` so a single column on a viewport
 * narrower than either shrinks to the container instead of overflowing it.
 */
function buildCappedTemplate(
	minWidth: number,
	maxCols: number,
	repeatMode: 'auto-fill' | 'auto-fit',
	gap: SpacingStep | undefined,
	columnGap: SpacingStep | undefined
): string {
	const gapVar =
		columnGap != null ? spacingVarNames[columnGap] : gap != null ? spacingVarNames[gap] : null;

	// The width a track would have if exactly `maxCols` columns were present,
	// used as a floor so the grid never fits more than `maxCols`.
	const perColumn = gapVar
		? `calc((100% - ${maxCols - 1} * var(${gapVar})) / ${maxCols})`
		: `calc(100% / ${maxCols})`;

	return `repeat(${repeatMode}, minmax(min(100%, max(${minWidth}px, ${perColumn})), 1fr))`;
}

/** Resolve the `columns` / `minChildWidth` props to a track list. */
export function resolveTemplateColumns(
	columns: GridColumns | undefined,
	minChildWidth: number,
	gap: SpacingStep | undefined,
	columnGap: SpacingStep | undefined
): string {
	if (typeof columns === 'object' && columns != null) {
		const repeatMode = columns.repeat === 'fit' ? 'auto-fit' : 'auto-fill';

		return columns.max != null && columns.max > 0
			? buildCappedTemplate(columns.minWidth, columns.max, repeatMode, gap, columnGap)
			: `repeat(${repeatMode}, minmax(${columns.minWidth}px, 1fr))`;
	}

	if (minChildWidth > 0) {
		// Deprecated path: minChildWidth uses auto-fit, for backward compatibility.
		const numColumns = typeof columns === 'number' ? columns : 0;

		return numColumns > 0
			? buildCappedTemplate(minChildWidth, numColumns, 'auto-fit', gap, columnGap)
			: `repeat(auto-fit, minmax(${minChildWidth}px, 1fr))`;
	}

	if (typeof columns === 'number' && columns > 0) return `repeat(${columns}, 1fr)`;

	return '1fr';
}

export interface GridAttrsOptions {
	templateColumns: string;
	rowHeight?: number;
	gap?: SpacingStep;
	rowGap?: SpacingStep;
	columnGap?: SpacingStep;
	align?: GridAlignment;
	justify?: GridAlignment;
}

export function gridAttrs(
	{ templateColumns, rowHeight, gap, rowGap, columnGap, align, justify }: GridAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		baseStyles.grid,
		dynamicStyles.templateColumns(templateColumns),
		rowHeight != null && dynamicStyles.autoRows(rowHeight),
		gap != null && gapStyles[gap],
		rowGap != null && rowGapStyles[rowGap],
		columnGap != null && columnGapStyles[columnGap],
		align != null && alignStyles[align],
		justify != null && justifyStyles[justify],
		xstyle
	);
}
