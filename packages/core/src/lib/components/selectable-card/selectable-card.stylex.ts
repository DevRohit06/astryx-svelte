import * as stylex from '@stylexjs/stylex';
import type { CardVariant } from '../card/card.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

const styles = stylex.create({
	interactive: {
		position: 'relative',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		transitionProperty: 'box-shadow, border-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	// Hover overlay guarded by `@media (hover: hover)` so touch devices don't
	// show a stuck hover; the active/pressed state works everywhere.
	overlay: {
		'::after': {
			content: '""',
			position: 'absolute',
			inset: 0,
			borderRadius: 'inherit',
			pointerEvents: 'none',
			transitionProperty: 'background-color',
			transitionDuration: durationVars['--duration-fast'],
			transitionTimingFunction: easeVars['--ease-standard'],
			backgroundColor: 'transparent'
		},
		':active::after': {
			backgroundColor: colorVars['--color-overlay-pressed']
		}
	},
	hoverOnPointer: {
		'@media (hover: hover)': {
			':hover:where(:not(:disabled,[aria-disabled="true"]))::after': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		}
	},
	disabled: {
		cursor: 'default',
		opacity: 0.5
	},
	srOnly: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		borderWidth: 0
	},
	// Selection indicator — an inset ring drawn via the card's `--_card-ring`
	// shadow slot (zero layout jitter) plus a `borderColor` change on the card's
	// own border for a cohesive look. Routing the ring through `--_card-ring`
	// rather than `box-shadow` directly is what lets it **compose** with the
	// card's elevation instead of clobbering it — `Card.card` lists both vars in
	// one `box-shadow`, so a selected *and* raised card keeps both.
	selected: {
		borderColor: colorVars['--color-accent'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-accent']}`
	},
	selectedBlue: {
		borderColor: colorVars['--color-border-blue'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-blue']}`
	},
	selectedCyan: {
		borderColor: colorVars['--color-border-cyan'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-cyan']}`
	},
	selectedGray: {
		borderColor: colorVars['--color-border-gray'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-gray']}`
	},
	selectedGreen: {
		borderColor: colorVars['--color-border-green'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-green']}`
	},
	selectedOrange: {
		borderColor: colorVars['--color-border-orange'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-orange']}`
	},
	selectedPink: {
		borderColor: colorVars['--color-border-pink'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-pink']}`
	},
	selectedPurple: {
		borderColor: colorVars['--color-border-purple'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-purple']}`
	},
	selectedRed: {
		borderColor: colorVars['--color-border-red'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-red']}`
	},
	selectedTeal: {
		borderColor: colorVars['--color-border-teal'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-teal']}`
	},
	selectedYellow: {
		borderColor: colorVars['--color-border-yellow'],
		'--_card-ring': `inset 0 0 0 2px ${colorVars['--color-border-yellow']}`
	}
});

function selectedStyleForVariant(variant: CardVariant) {
	switch (variant) {
		case 'blue':
			return styles.selectedBlue;
		case 'cyan':
			return styles.selectedCyan;
		case 'gray':
			return styles.selectedGray;
		case 'green':
			return styles.selectedGreen;
		case 'orange':
			return styles.selectedOrange;
		case 'pink':
			return styles.selectedPink;
		case 'purple':
			return styles.selectedPurple;
		case 'red':
			return styles.selectedRed;
		case 'teal':
			return styles.selectedTeal;
		case 'yellow':
			return styles.selectedYellow;
		default:
			return styles.selected;
	}
}

export interface SelectableCardXstyleOptions {
	variant: CardVariant;
	isSelected: boolean;
	isDisabled: boolean;
}

/**
 * The interaction/selection styles handed to `Card`'s `xstyle` prop (an array,
 * exactly as upstream). They stay live style objects here — `Card` resolves them
 * through its own `sx()`, which is what keeps them as object-mode dist entries.
 */
export function selectableCardXstyle(
	{ variant, isSelected, isDisabled }: SelectableCardXstyleOptions,
	xstyle?: StyleArg
): StyleArg {
	return [
		styles.interactive,
		focusOutlineStyles.focusWithin,
		isSelected && selectedStyleForVariant(variant),
		!isDisabled && styles.overlay,
		!isDisabled && styles.hoverOnPointer,
		isDisabled && styles.disabled,
		xstyle
	];
}

/** The visually-hidden checkbox that carries the accessible role/label/state. */
export function selectableCardInputAttrs(): SvelteStyleAttrs {
	return sx(styles.srOnly);
}
