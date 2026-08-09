import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';

/**
 * Ported from the `styles` block in Astryx's `Chat/ChatSendButton.tsx`.
 *
 * The literal `var(--_button-radius, var(--radius-full))` is upstream's, not a
 * token reference: `--_button-radius` is one of the internal custom properties
 * the theme's `derivedVarRegistry` writes, so a theme that sets a button radius
 * reaches this button too, and the `--radius-full` fallback keeps it circular
 * when none does.
 *
 * Returned as a raw style object rather than through `sx()` because the only
 * consumer hands it to `Button`'s `xstyle`, which composes it itself.
 */
const styles = stylex.create({
	root: {
		borderRadius: 'var(--_button-radius, var(--radius-full))',
		flexShrink: 0
	}
});

/** The send button's own style, composed ahead of the caller's `xstyle`. */
export function chatSendButtonStyle(xstyle?: StyleArg): StyleArg[] {
	return [styles.root, xstyle];
}
