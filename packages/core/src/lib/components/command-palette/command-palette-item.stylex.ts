import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	radiusVars,
	typographyVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/** Ported from Astryx's `CommandPalette/CommandPaletteItem.tsx` styles. */
const HOVER_HOVER = '@media (hover: hover)';

const styles = stylex.create({
	item: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		paddingInline: spacingVars['--spacing-3'],
		paddingBlock: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-inner'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		border: 'none',
		cursor: 'pointer',
		textAlign: 'start' as const,
		outline: 'none',
		userSelect: 'none'
	},
	itemHover: {
		':hover': {
			[HOVER_HOVER]: {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		},
		':active': {
			backgroundColor: colorVars['--color-overlay-pressed']
		}
	},
	itemHighlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	itemDisabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	},
	itemSelected: {
		backgroundColor: colorVars['--color-accent-muted']
	}
});

/** The `role="option"` row. */
export function commandPaletteItemAttrs(
	isDisabled: boolean,
	isHighlighted: boolean,
	isSelected: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.item,
		!isDisabled && styles.itemHover,
		isHighlighted && styles.itemHighlighted,
		isSelected && styles.itemSelected,
		isDisabled && styles.itemDisabled,
		xstyle
	);
}
