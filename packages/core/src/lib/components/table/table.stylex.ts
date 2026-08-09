import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Table/table.stylex.ts` — the styles `TableCell`,
 * `TableHeaderCell` and `TableRow` share.
 *
 * These stay raw `stylex.create` objects rather than `sx()` helpers, because
 * every consumer merges them into a longer, conditionally-built list and StyleX
 * has to resolve that list in one call for the atomic dedup to be correct.
 * `navItemStyles` set the same precedent.
 *
 * `tableRowMarker` lives next door in `table.markers.stylex.ts`; see that file
 * for why a marker needs its own module.
 */

/**
 * Overflow truncation for table cells.
 *
 * Applied at the <td>/<th> level when textOverflow is 'truncate'.
 * For data-driven tables in truncate mode, the default renderer wraps
 * content in <Text maxLines={1}> for smart tooltips that only appear
 * when text is actually overflowing.
 */
export const overflowStyles = stylex.create({
	cell: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		maxWidth: '0'
	}
});

/**
 * Wrap styles for table cells.
 *
 * Applied at the <td>/<th> level when textOverflow is 'wrap'.
 * Text wraps naturally and the row grows taller to fit. No content is hidden.
 */
export const wrapStyles = stylex.create({
	cell: {
		overflow: 'hidden',
		overflowWrap: 'break-word',
		wordBreak: 'break-word',
		maxWidth: '0'
	}
});

/**
 * Container edge compensation for table cells.
 *
 * When a table is inside a Card, Section, or Layout area, the table
 * element applies negative inline margins to bleed edge-to-edge
 * (see the scroll wrapper's containerBleed style). These styles ensure the
 * first and last columns' outer padding aligns with the container's
 * content inset, with a minimum of --spacing-2 (8px).
 *
 * Each density variant uses its own paddingInline as the fallback,
 * so standalone tables (where --container-padding-inline-start/end are unset)
 * keep their normal density-based cell padding unchanged.
 */
export const containerEdgeStyles = stylex.create({
	compact: {
		paddingInlineStart: {
			default: null,
			':first-child': `max(var(--container-padding-inline-start, ${spacingVars['--spacing-2']}), ${spacingVars['--spacing-2']})`
		},
		paddingInlineEnd: {
			default: null,
			':last-child': `max(var(--container-padding-inline-end, ${spacingVars['--spacing-2']}), ${spacingVars['--spacing-2']})`
		}
	},
	balanced: {
		paddingInlineStart: {
			default: null,
			':first-child': `max(var(--container-padding-inline-start, ${spacingVars['--spacing-3']}), ${spacingVars['--spacing-2']})`
		},
		paddingInlineEnd: {
			default: null,
			':last-child': `max(var(--container-padding-inline-end, ${spacingVars['--spacing-3']}), ${spacingVars['--spacing-2']})`
		}
	},
	spacious: {
		paddingInlineStart: {
			default: null,
			':first-child': `max(var(--container-padding-inline-start, ${spacingVars['--spacing-4']}), ${spacingVars['--spacing-2']})`
		},
		paddingInlineEnd: {
			default: null,
			':last-child': `max(var(--container-padding-inline-end, ${spacingVars['--spacing-4']}), ${spacingVars['--spacing-2']})`
		}
	}
});
