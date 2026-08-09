import * as stylex from '@stylexjs/stylex';
import type { CardVariant } from '../card/card.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { borderVars, colorVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	interactive: {
		position: 'relative',
		cursor: 'pointer',
		textDecoration: 'none',
		color: 'inherit',
		outlineOffset: '2px'
	},
	focusWithin: {
		':has(:focus-visible)': {
			outline: `2px solid ${colorVars['--color-accent']}`,
			outlineOffset: '2px'
		}
	},
	// Hover overlay guarded by `@media (hover: hover)` so touch devices don't show
	// a stuck hover; the active/pressed state works everywhere.
	overlay: {
		'::after': {
			content: '""',
			position: 'absolute',
			inset: 0,
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
			':hover::after': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		}
	},
	// Non-`default` variants drop Card's transparent 1px border so the overlay
	// reaches the box edge instead of leaving an untinted ring.
	borderless: {
		borderWidth: 0
	},
	// `default` draws the 1px border *within* the padding (width subtracted per
	// side) so total inset matches the borderless variants; it emphasizes on hover.
	bordered: {
		borderColor: colorVars['--color-border'],
		paddingInlineStart: `calc(var(--container-padding-inline-start) - ${borderVars['--border-width']})`,
		paddingInlineEnd: `calc(var(--container-padding-inline-end) - ${borderVars['--border-width']})`,
		paddingBlockStart: `calc(var(--container-padding-block-start) - ${borderVars['--border-width']})`,
		paddingBlockEnd: `calc(var(--container-padding-block-end) - ${borderVars['--border-width']})`,
		transitionProperty: 'border-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	borderedHoverOnPointer: {
		'@media (hover: hover)': {
			':hover': {
				borderColor: colorVars['--color-border-emphasized']
			}
		}
	},
	disabled: {
		cursor: 'not-allowed',
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
	}
});

export interface ClickableCardXstyleOptions {
	variant: CardVariant;
	isDisabled: boolean;
}

/**
 * The interactive layer handed to `Card`'s `xstyle` prop (an array, exactly as
 * upstream). They stay live style objects — `Card` resolves them through its own
 * `sx()`, which keeps them as object-mode dist entries.
 */
export function clickableCardXstyle(
	{ variant, isDisabled }: ClickableCardXstyleOptions,
	xstyle?: StyleArg
): StyleArg {
	const hasBorder = variant === 'default';
	return [
		styles.interactive,
		styles.focusWithin,
		hasBorder ? styles.bordered : styles.borderless,
		!isDisabled && styles.overlay,
		!isDisabled && styles.hoverOnPointer,
		!isDisabled && hasBorder && styles.borderedHoverOnPointer,
		isDisabled && styles.disabled,
		xstyle
	];
}

/** The visually-hidden `<button>`/`<a>` that carries the accessible role/label. */
export function clickableCardControlAttrs(): SvelteStyleAttrs {
	return sx(styles.srOnly);
}
