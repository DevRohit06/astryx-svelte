import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars, radiusVars, spacingVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/rowExpansion/useTableRowExpansion.tsx`.
 *
 * Group name is upstream's (`expansionStyles`) so the class oracle needs no
 * rename, and every declaration is transcribed verbatim.
 *
 * **Rewritten wholesale at upstream 0.4.1 (PR #4609).** The plugin used to draw
 * hierarchy — indented child cells, a per-depth `indent(px)` function style, a
 * chevron-sized spacer, a clickable row — and now draws a full-width detail
 * panel and nothing else. `chevronIcon`, `indentedCell`, `indent`, `placeholder`
 * and `clickableRow` went with the hierarchy (it belongs to `tree.stylex.ts`);
 * `expandedRow` and `expandedCell` are the panel. Two edits inside
 * `chevronButton` are easy to miss and both are real: `transitionProperty` loses
 * `background-color`, and `flexShrink` is gone — the button no longer sits in a
 * flex row beside cell content.
 *
 * `chevronExpanded` now composes onto the **button** rather than onto an icon
 * wrapper, which is why the module exports one attrs function for the pair
 * rather than two.
 */

const expansionStyles = stylex.create({
	chevronButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: spacingVars['--spacing-6'],
		height: spacingVars['--spacing-6'],
		background: 'transparent',
		border: 'none',
		borderRadius: radiusVars['--radius-inner'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		color: colorVars['--color-icon-secondary'],
		transitionProperty: 'transform, color',
		transitionDuration: '150ms',
		padding: 0,
		// Match IconButton ghost hover: subtle overlay background.
		backgroundImage: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			}
		},
		':hover:where(:not(:disabled,[aria-disabled="true"]))': {
			color: colorVars['--color-icon-primary']
		}
	},
	// The RTL mirror is folded into each state's transform rather than living on a
	// parent span, matching `TreeListItem`'s chevron (both are `transform`, so on
	// one element the later value would win).
	chevronExpanded: {
		transform: {
			default: 'rotate(90deg)',
			':is([dir="rtl"] *)': 'scaleX(-1) rotate(90deg)'
		}
	},
	chevronCollapsed: {
		transform: {
			default: 'rotate(0deg)',
			':is([dir="rtl"] *)': 'scaleX(-1) rotate(0deg)'
		}
	},
	expandedRow: {
		backgroundColor: colorVars['--color-background-muted']
	},
	expandedCell: {
		paddingBlock: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-5']
	}
});

/** The transparent, borderless chevron button, rotated a quarter turn while expanded. */
export function expansionChevronButtonAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(
		expansionStyles.chevronButton,
		isExpanded ? expansionStyles.chevronExpanded : expansionStyles.chevronCollapsed
	);
}

/** The detail panel's `<tr>`. */
export function expansionExpandedRowAttrs(): SvelteStyleAttrs {
	return sx(expansionStyles.expandedRow);
}

/** The detail panel's full-width `<td>`. */
export function expansionExpandedCellAttrs(): SvelteStyleAttrs {
	return sx(expansionStyles.expandedCell);
}
