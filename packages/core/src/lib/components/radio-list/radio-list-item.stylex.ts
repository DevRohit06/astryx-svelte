import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { indicatorScope } from '../indicator/indicator.markers.stylex.js';
import type { RadioListSize } from './radio-list-context.svelte.js';

/**
 * Ported from Astryx's `RadioList/RadioListItem.tsx` styles.
 *
 * **This component no longer draws a radio.** Upstream 0.4.0 moved the circle,
 * its inner dot and their two size ramps into `RadioIndicator`, so what is left
 * is the wrapper square, the transparent `<input type="radio">` and the
 * `display: contents` indicator slot. The hover tints still resolve through an
 * ancestor marker so a parent container's hover never bleeds in — the shared
 * `indicatorScope` rather than a `radioScope` of its own, since the tinted
 * element belongs to the theme's indicator.
 *
 * Upstream 0.5.0 made the whole row a click target: the row's own flex
 * container is gone and `Item` **is** the row, so the marker and the
 * appearance reset ride `Item`'s `xstyle` rather than a wrapper of their own.
 */
const styles = stylex.create({
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

const rowStyles = stylex.create({
	// The row's default appearance is a bare surface: no density padding, no
	// radius, and no full-row background — only the indicator tints on hover
	// (via `indicatorScope`). Item paints padding/radius/hover as an interactive
	// row, so this neutralizes them at the component level. A theme's
	// `radio-list-item` overrides still win: they land in `@layer astryx-theme`,
	// above the component's base StyleX layer, so themes opt back into row
	// padding/radius/hover/selected styling. `minWidth: 0` preserves label
	// truncation now that the Item is the row's flex child.
	root: {
		paddingBlock: 0,
		paddingInline: 0,
		borderRadius: 0,
		minWidth: 0,
		// Suppress Item's interactive hover/press background so the resting and
		// hovered row look identical by default (a theme can restyle either).
		backgroundColor: 'transparent'
	}
});

/**
 * The `xstyle` array the row hands to `Item`.
 *
 * Hover reaches the radio visual through the ancestor marker rather than props,
 * so hovering the row tints the control. The marker rides the painting row
 * element (Item), the same element that carries the theme target, so a theme's
 * hover styling stays in step with the tint. `rowStyles.root` restores the bare
 * default look, applied after Item's own base styles so it wins within the base
 * layer.
 */
export function radioListItemRowXstyle(isDisabled: boolean, xstyle: StyleArg): StyleArg {
	return [!isDisabled && indicatorScope, rowStyles.root, xstyle];
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
