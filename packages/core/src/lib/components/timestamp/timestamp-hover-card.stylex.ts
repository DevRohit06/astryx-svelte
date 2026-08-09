import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Styles for Timestamp's copyable hover card, ported from Astryx's
 * `src/Timestamp/TimestampHoverCard.tsx`.
 *
 * Layout: a semantic `<dl>` laid out as a grid. Labelled cards use three
 * columns — label, value, and a trailing action column for copy buttons — so
 * the buttons align down a single column no matter how wide each value is. The
 * action column is only added when at least one row is copyable, so a fully
 * read-only card carries no dangling gutter. Label-less cards drop the label
 * column and stack to whatever columns remain.
 */
const styles = stylex.create({
	// The card is a definition list laid out as a grid so cells align into
	// columns across rows. `gridTemplateColumns` is set per-card (below) to add
	// or drop the label and action columns; the row/column gaps live here.
	dl: {
		display: 'grid',
		alignItems: 'center',
		columnGap: spacingVars['--spacing-4'],
		rowGap: spacingVars['--spacing-2'],
		margin: 0,
		padding: 0
	},
	// Each row spans the full grid so its cells land in the shared columns.
	// `display: contents` lets the <dt>/<dd> participate directly in the grid.
	row: {
		display: 'contents'
	},
	// Label: the design system's `supporting` role — secondary colour, the
	// supporting size/leading, normal weight. This matches Timestamp's own
	// default `type` ('supporting'), so the card's labels read at the same
	// register as the component itself.
	label: {
		color: colorVars['--color-text-secondary'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		margin: 0,
		padding: 0,
		whiteSpace: 'nowrap'
	},
	// Value: the `body` role — primary colour, body size/leading, normal weight.
	value: {
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		margin: 0,
		padding: 0,
		whiteSpace: 'nowrap'
	},
	// The trailing action cell holds the copy button (or nothing, on a
	// read-only row). It lives in its own grid column so buttons align.
	action: {
		display: 'flex',
		justifyContent: 'flex-end',
		alignItems: 'center'
	}
});

// Grid templates, selected per-card by which columns are present.
// - hasAnyLabel + hasAnyCopyable → label | value | action
// - hasAnyLabel only             → label | value
// - hasAnyCopyable only          → value | action
// - neither                      → value
const gridTemplates = stylex.create({
	labelValueAction: { gridTemplateColumns: 'auto 1fr auto' },
	labelValue: { gridTemplateColumns: 'auto 1fr' },
	valueAction: { gridTemplateColumns: '1fr auto' },
	value: { gridTemplateColumns: '1fr' }
});

function gridTemplateFor(hasLabelColumn: boolean, hasActionColumn: boolean) {
	if (hasLabelColumn && hasActionColumn) {
		return gridTemplates.labelValueAction;
	}
	if (hasLabelColumn) {
		return gridTemplates.labelValue;
	}
	if (hasActionColumn) {
		return gridTemplates.valueAction;
	}
	return gridTemplates.value;
}

/** The `<dl>` grid, with only the columns this card actually needs. */
export function timestampHoverCardListAttrs(
	hasLabelColumn: boolean,
	hasActionColumn: boolean
): SvelteStyleAttrs {
	return sx(styles.dl, gridTemplateFor(hasLabelColumn, hasActionColumn));
}

/** One row, spanning the grid via `display: contents`. */
export function timestampHoverCardRowAttrs(): SvelteStyleAttrs {
	return sx(styles.row);
}

/** The `<dt>` label cell. */
export function timestampHoverCardLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.label);
}

/** The `<dd>` value cell. */
export function timestampHoverCardValueAttrs(): SvelteStyleAttrs {
	return sx(styles.value);
}

/** The trailing action cell holding a row's copy button. */
export function timestampHoverCardActionAttrs(): SvelteStyleAttrs {
	return sx(styles.action);
}
