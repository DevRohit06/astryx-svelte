import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../internal/sx.js';
import {
	colorVars,
	radiusVars,
	shadowVars,
	spacingVars,
	typeScaleVars
} from '../styles/tokens.stylex.js';

/**
 * The keyboard hint's styles, from Astryx's `hooks/useKeyboardHint.tsx`.
 *
 * They sit in their own `.stylex.ts` for the reason every hook's do: the StyleX
 * bundler plugin Babel-parses anything importing `@stylexjs/stylex`, and
 * `use-keyboard-hint.svelte.ts` has to stay a plain rune module. This is
 * `hooks/entry-animation.stylex.ts`'s arrangement — the second hook in the port
 * to have styles at all.
 */
const styles = stylex.create({
	hint: {
		// Top layer + anchor positioned
		position: 'fixed',
		inset: 'auto',
		margin: 0,
		// `border: 'none'` emits no class at all — StyleX drops it on both sides,
		// so there is no rule for it in upstream's compiled CSS either. It is
		// transcribed for source parity and is inert; rewriting it as
		// `borderWidth`/`borderStyle` would invent classes upstream does not have.
		border: 'none',

		// Surface
		backgroundColor: colorVars['--color-background-popover'],
		borderRadius: radiusVars['--radius-element'],
		boxShadow: shadowVars['--shadow-low'],
		paddingBlockStart: spacingVars['--spacing-1'],
		paddingBlockEnd: spacingVars['--spacing-1'],
		paddingInlineStart: spacingVars['--spacing-2'],
		paddingInlineEnd: spacingVars['--spacing-2'],

		// Typography
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		whiteSpace: 'nowrap',

		// Animation
		opacity: {
			default: 0,
			':popover-open': 1
		},
		transitionProperty: 'opacity, display, overlay',
		transitionDuration: '150ms',
		transitionBehavior: 'allow-discrete',

		// Don't capture pointer events (hint floats above content)
		pointerEvents: 'none'
	},
	keys: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	label: {
		marginInlineStart: spacingVars['--spacing-1']
	}
});

/**
 * The popover surface's `xstyle`. Upstream passes `styles.hint` straight into
 * `layer.render`, so this stays a style object rather than finished attributes
 * — `<Layer>` composes it with its own base styles, and a finished class string
 * cannot take part in that merge.
 */
export const keyboardHintXstyle: StyleArg = styles.hint;

/** The inline-flex row holding one `<Kbd>` per arrow. */
export function keyboardHintKeysAttrs(): SvelteStyleAttrs {
	return sx(styles.keys);
}

/** The "to navigate" label beside the keys. */
export function keyboardHintLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.label);
}

/**
 * The inline gap between the anchor and the hint. Upstream passes this as a
 * `style` object to `layer.render`, and its own test asserts the *unresolved*
 * `var(--spacing-2)` text, so it has to stay a literal declaration rather than
 * becoming another StyleX key.
 */
export const KEYBOARD_HINT_OFFSET_STYLE = `margin-block-start:${spacingVars['--spacing-2']}`;
