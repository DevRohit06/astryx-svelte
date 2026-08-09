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
		flexShrink: 0
	}
});

/** The 20px height + no-shrink override, passed to `Button`'s `xstyle`. */
export const clearButtonStyle = styles.button;
