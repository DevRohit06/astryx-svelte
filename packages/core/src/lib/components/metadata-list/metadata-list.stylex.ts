import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/** `single` for one column, `multi` to auto-fill, or a fixed count. */
export type MetadataListColumns = 'multi' | 'single' | number;

const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column'
	},
	title: {
		marginBottom: spacingVars['--spacing-3']
	},
	// <dl> reset
	dl: {
		margin: 0,
		padding: 0
	},
	// Vertical orientation — a grid of label/value pairs.
	gridSingle: {
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gap: `${spacingVars['--spacing-2']} ${spacingVars['--spacing-4']}`,
		alignItems: 'baseline'
	},
	gridMulti: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
		gap: spacingVars['--spacing-4']
	},
	// Stacked labels (`position: 'top'`) inside a single-column layout.
	gridStackedSingle: {
		display: 'grid',
		gridTemplateColumns: '1fr',
		gap: spacingVars['--spacing-3']
	},
	gridStackedMulti: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
		gap: spacingVars['--spacing-4']
	},
	// Horizontal orientation — a wrapping flex row.
	horizontal: {
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-4']
	},
	toggleButton: {
		appearance: 'none',
		background: 'none',
		border: 'none',
		padding: `${spacingVars['--spacing-2']} 0`,
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		color: colorVars['--color-accent'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		fontFamily: 'inherit',
		textAlign: 'start',
		alignSelf: 'flex-start'
	}
});

// A fixed numeric column count (and a custom label width) is only known at
// runtime, so it comes from a dynamic style rather than a static rule.
const dynamicStyles = stylex.create({
	gridTemplate: (gridTemplateColumns: string) => ({ gridTemplateColumns })
});

export function metadataListRootAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

export function metadataListTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.title);
}

export function metadataListToggleAttrs(): SvelteStyleAttrs {
	return sx(styles.toggleButton);
}

export interface MetadataListGridOptions {
	columns: MetadataListColumns;
	isStacked: boolean;
	isHorizontal: boolean;
	/**
	 * The runtime `grid-template-columns` for a fixed numeric column count or a
	 * custom label width, or `null` when the static rule already has it right.
	 * Computed in the component, as upstream's `getGridTemplateColumns` is.
	 */
	gridTemplateColumns: string | null;
}

/** The grid the `<dl>` takes, chosen by orientation, columns and label position. */
export function metadataListGridAttrs({
	columns,
	isStacked,
	isHorizontal,
	gridTemplateColumns
}: MetadataListGridOptions): SvelteStyleAttrs {
	if (isHorizontal) return sx(styles.dl, styles.horizontal);

	const isSingle = columns === 'single' || columns === 1;
	const grid = isStacked
		? isSingle
			? styles.gridStackedSingle
			: styles.gridStackedMulti
		: isSingle
			? styles.gridSingle
			: styles.gridMulti;

	return sx(
		styles.dl,
		grid,
		gridTemplateColumns != null && dynamicStyles.gridTemplate(gridTemplateColumns)
	);
}
