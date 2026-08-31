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
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';

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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		textAlign: 'start' as const,
		outline: 'none',
		userSelect: 'none'
	},
	itemHover: {
		':hover:where(:not(:disabled,[aria-disabled="true"]))': {
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
		cursor: 'default'
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
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		!isDisabled && interactionOverlayStyles.backgroundColor,
		!isDisabled && styles.itemHover,
		isHighlighted && styles.itemHighlighted,
		isSelected && styles.itemSelected,
		isDisabled && styles.itemDisabled,
		xstyle
	);
}
