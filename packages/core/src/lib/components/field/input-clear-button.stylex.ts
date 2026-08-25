import * as stylex from '@stylexjs/stylex';

/**
 * Ported from Astryx's `Field/InputClearButton.tsx`.
 *
 * The whole reason this component exists is to shrink a ghost `Button` to a
 * 20px clear affordance. The override is threaded into `Button` through
 * `xstyle` — *not* `class` — so StyleX's atomic dedup replaces `Button`'s own
 * `height` class rather than appending a second, competing one whose winner
 * stylesheet order would decide. That is exactly the `xstyle`-over-`cx`
 * decision the repo settled repo-wide.
 */
const styles = stylex.create({
	button: {
		height: '20px',
		flexShrink: 0,
		// Containing block for the ::after hit overlay below. Button sets its own
		// `position: relative`, so the overlay would resolve correctly without
		// this — but that is another component's internal, and if it ever changes
		// the overlay silently reattaches to some ancestor and the hit area lands
		// in the wrong place. Declaring it here keeps the containing block
		// colocated with the thing that depends on it. No-op at runtime.
		position: 'relative',
		// Expand the tap target to 24px ONLY on touch (WCAG 2.5.8 AA is a touch
		// requirement, and its floor is 24x24). On a fine pointer the 20px glyph
		// is precise enough, and an unconditional overlay could overlap
		// neighboring controls in dense layouts. The inset is 0 by default (hit
		// area == visual glyph) and grows to -2px (=> 24x24) under a coarse
		// pointer — no further, because at -4px the overlay reaches into the 8px
		// adornment gap and, on the inline-start side, over the input's own caret
		// area. Driven through a custom property because StyleX only allows plain
		// values inside a pseudo-element; the conditional lives on this top-level
		// property instead. Private (--_) because it is an internal implementation
		// detail, not a themeable target.
		'--_input-clear-hit-inset': {
			default: '0px',
			'@media (pointer: coarse)': '-2px'
		},
		// The overlay itself is gated too, not just its size. An ::after that is
		// generated on a fine pointer sits exactly over the button at inset 0,
		// where it adds no hit area but is the topmost hit-test box — so hover
		// stops reaching the descendants and `.astryx-input-clear-icon:hover`, a
		// public theme target, no longer matches. `content: none` means the
		// pseudo-element is not generated at all, so on a fine pointer the
		// overlay does not exist.
		'--_input-clear-hit-content': {
			default: 'none',
			'@media (pointer: coarse)': '""'
		},
		'::after': {
			content: 'var(--_input-clear-hit-content)',
			position: 'absolute',
			inset: 'var(--_input-clear-hit-inset)'
		}
	}
});

/**
 * The 20px height + no-shrink override and the coarse-pointer hit overlay,
 * passed to `Button`'s `xstyle`.
 */
export const clearButtonStyle = styles.button;
