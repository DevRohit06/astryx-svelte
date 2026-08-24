import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, spacingVars } from '../../styles/tokens.stylex.js';
import { indicatorScope } from '../indicator/indicator.markers.stylex.js';
import type { RadioListSize } from './radio-list-context.svelte.js';

/**
 * Ported from Astryx's `RadioList/RadioListItem.tsx` styles.
 *
 * **This component no longer draws a radio.** Upstream 0.4.0 moved the circle,
 * its inner dot and their two size ramps into `RadioIndicator`, so what is left
 * is the row, the wrapper square, the transparent `<input type="radio">`, the
 * `display: contents` indicator slot and the label. The hover tints still
 * resolve through an ancestor marker so a parent container's hover never bleeds
 * in — now the shared `indicatorScope` rather than a `radioScope` of its own,
 * since the tinted element belongs to the theme's indicator. The item container
 * carries the marker only when enabled.
 */
const styles = stylex.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	radioWrapper: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		isolation: 'isolate'
	},
	input: {
		position: 'absolute',
		margin: 0,
		padding: 0,
		opacity: 0,
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		zIndex: 1,
		minInlineSize: {
			default: null,
			'@media (pointer: coarse)': '24px'
		},
		minBlockSize: {
			default: null,
			'@media (pointer: coarse)': '24px'
		},
		insetBlockStart: {
			default: null,
			'@media (pointer: coarse)': '50%'
		},
		insetInlineStart: {
			default: null,
			'@media (pointer: coarse)': '50%'
		},
		transform: {
			default: null,
			'@media (pointer: coarse)': 'translate(-50%, -50%)'
		}
	},
	inputDisabled: {
		cursor: 'default'
	},
	// Holds only the indicator, so the focus ring has one unambiguous target.
	// `display: contents` adds no box of its own — the indicator keeps whatever
	// layout relationship it already had with the wrapper.
	indicatorSlot: {
		display: 'contents'
	},
	labelDisabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'default'
	}
});

const wrapperSizeStyles = stylex.create({
	sm: { width: 20, height: 20 },
	md: { width: 24, height: 24 }
});

// The `radioSizeStyles` / `dotSizeStyles` ramps that stood here moved to
// `RadioIndicator` at upstream 0.4.0, along with the seven style keys that drew
// the circle and its inner dot. This component no longer draws a radio — it
// renders whichever indicator the theme resolves for the `radio` name.

const embeddedStyles = stylex.create({
	root: {
		paddingBlock: 0,
		paddingInline: 0,
		borderRadius: 0,
		flex: 1,
		minWidth: 0
	}
});

/** Passed to the nested `Item` as `xstyle` so it fills the row flush. */
export const radioEmbeddedRoot: StyleArg = embeddedStyles.root;

/** The item container, marked (for hover scoping) only when enabled. */
export function radioListItemContainerAttrs(
	isDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.container, !isDisabled && indicatorScope, xstyle);
}

/**
 * The square that centres the input and the indicator.
 *
 * No longer carries a focus ring, which is why the `isDisabled` parameter is
 * gone: the ring is painted imperatively on the indicator's own element by
 * `useIndicatorFocusRing`, so it takes that element's shape instead of the
 * wrapper hardcoding a `border-radius: 50%` guess about a circle it does not
 * own — and the disabled guard moved to the hook with it.
 */
export function radioWrapperAttrs(size: RadioListSize): SvelteStyleAttrs {
	return sx(styles.radioWrapper, wrapperSizeStyles[size]);
}

/** The transparent `<input type="radio">` overlaid on the circle. */
export function radioInputAttrs(size: RadioListSize, isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.input, wrapperSizeStyles[size], isDisabled && styles.inputDisabled);
}

/**
 * A container holding ONLY the indicator, so the focus ring has an unambiguous
 * target whatever a theme renders. `display: contents` keeps it out of layout
 * entirely.
 *
 * This replaced `radioCircleAttrs`/`radioDotAttrs` at upstream 0.4.0 — the
 * circle and its dot are `RadioIndicator`'s now, and it takes the size itself.
 */
export function radioIndicatorSlotAttrs(): SvelteStyleAttrs {
	return sx(styles.indicatorSlot);
}

/** The `<label>`, dimmed when disabled. */
export function radioLabelAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(isDisabled && styles.labelDisabled);
}
