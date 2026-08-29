import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Visual density of the composer shell. */
export type ChatComposerDensity = 'compact' | 'balanced' | 'spacious';

/**
 * ChatComposer's elevation. A deliberate narrowing of the shared `Elevation`
 * union to the two tiers this surface actually has, matching upstream.
 */
export type ChatComposerElevation = 'none' | 'low';

/** Ported from the `styles` block in Astryx's `Chat/ChatComposer.tsx`. */
const styles = stylex.create({
	root: {
		position: 'relative',
		zIndex: 0,
		isolation: 'isolate',
		display: 'flex',
		flexDirection: 'column',
		// Component CSS vars — themeable via defineTheme({ components: { 'chat-composer': { base: {...} } } })
		// Uses the dedicated chat radius (28px) rather than --radius-page, so chat
		// rounding is decoupled from page-level containers but unchanged today. #2072
		'--_chat-composer-radius': radiusVars['--radius-chat'],
		'--_chat-composer-padding': spacingVars['--spacing-3'],
		// Concentric radius: buttons follow the outer shell's curvature.
		// Sets --_button-radius (not --radius-element) so only buttons are
		// affected — other components in slots keep their own radius.
		// Default: 28px - 12px = 16px (fully rounds a 32px button).
		'--_button-radius': `max(${radiusVars['--radius-element']}, calc(var(--_chat-composer-radius) - var(--_chat-composer-padding)))`
	},

	rootDisabled: {
		opacity: 0.6,
		pointerEvents: 'none' as const
	},
	body: {
		position: 'relative',
		zIndex: 2,
		display: 'flex',
		flexDirection: 'column',
		padding: 'var(--_chat-composer-padding)',
		gap: spacingVars['--spacing-2'],
		borderRadius: 'var(--_chat-composer-radius)',
		backgroundColor: colorVars['--color-background-popover'],
		cursor: {
			default: 'text',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		// The shadow moved out of `body` and into `elevationStyles` in 0.1.9 — the
		// two tiers differ in more than depth (`none` draws a real border and
		// re-insets the padding), so neither can be expressed as an override of a
		// base shadow. `border-color` joins the transition for the same reason.
		transition: `box-shadow ${durationVars['--duration-fast']} ${easeVars['--ease-standard']}, border-color ${durationVars['--duration-fast']} ${easeVars['--ease-standard']}`
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		minHeight: '28px'
	},
	headerLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	headerRight: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		marginInlineStart: 'auto',
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	inputArea: {
		display: 'flex',
		flexDirection: 'column'
	},
	textarea: {
		all: 'unset',
		width: '100%',
		resize: 'none' as const,
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontFamily: typographyVars['--font-family-body'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		caretColor: colorVars['--color-accent'],
		overflowY: 'auto' as const,
		maxHeight: '176px',
		'::placeholder': {
			color: colorVars['--color-text-disabled']
		}
	},
	footer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		// Footer buttons should use size="md" to match 32px send button height
		minHeight: '32px'
	},
	footerLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	footerRight: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	statusBar: {
		position: 'relative',
		zIndex: 0,
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-4'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontFamily: typographyVars['--font-family-body']
	},
	statusTop: {
		paddingBlockStart: 'var(--_chat-composer-padding)',
		paddingBlockEnd: 'calc(var(--_chat-composer-padding) + var(--_chat-composer-radius))',
		marginBlockEnd: 'calc(-1 * var(--_chat-composer-radius))',
		borderStartStartRadius: 'var(--_chat-composer-radius)',
		borderStartEndRadius: 'var(--_chat-composer-radius)'
	},
	statusBottom: {
		paddingBlockStart: 'calc(var(--_chat-composer-padding) + var(--_chat-composer-radius))',
		paddingBlockEnd: 'var(--_chat-composer-padding)',
		marginBlockStart: 'calc(-1 * var(--_chat-composer-radius))',
		borderEndStartRadius: 'var(--_chat-composer-radius)',
		borderEndEndRadius: 'var(--_chat-composer-radius)'
	},
	statusError: {
		backgroundColor: colorVars['--color-error-muted'],
		color: colorVars['--color-text-red']
	},
	statusWarning: {
		backgroundColor: colorVars['--color-warning-muted'],
		color: colorVars['--color-text-yellow']
	},
	compact: {
		// Override the padding *var* (not the `padding` property) so both the base
		// body padding and the border-inset calc in `elevationStyles.none` pick up
		// the compact value. Scoped to the body element, so the status bar (which
		// reads the var from root) keeps its own padding.
		'--_chat-composer-padding': spacingVars['--spacing-2'],
		gap: spacingVars['--spacing-1']
	}
});

/**
 * ChatComposer's elevation, new in 0.1.9 — `'none' | 'low'` only, a deliberate
 * narrowing of the shared `Elevation` union (there is no `med`/`high` composer).
 *
 * The two tiers are not the same surface at different depths, which is why this
 * could not stay a shadow override on `body`:
 *
 * - **`low`** is today's look — a resting shadow that deepens on hover and
 *   focus-within.
 * - **`none`** replaces the shadow with a real border, and re-insets the body
 *   padding by the border width (the `Card.withBorder` trick) so total inset
 *   matches the elevated case and content geometry does not shift between them.
 *   Hover and focus are then drawn as *inset* rings rather than drop shadows.
 */
const elevationStyles = stylex.create({
	low: {
		boxShadow: {
			default: shadowVars['--shadow-low'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': shadowVars['--shadow-med']
			}
		},
		':focus-within': {
			boxShadow: shadowVars['--shadow-med']
		}
	},
	none: {
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			':focus-within': colorVars['--color-accent']
		},
		padding: `calc(var(--_chat-composer-padding) - ${borderVars['--border-width']})`,
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within):where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `inset 0px 0px 0px 2px color-mix(in srgb, ${colorVars['--color-border-emphasized']} 30%, transparent)`
			},
			':focus-within': `inset 0px 0px 0px 2px ${colorVars['--color-accent-muted']}`
		}
	}
});

/**
 * `styles.textarea` has no call site — upstream declares it for a default
 * textarea it no longer renders (`ChatComposerInput` took over). It stays for
 * the reason `chat-tool-calls.stylex.ts` keeps its dead keys: the class oracle
 * diffs the module's whole compiled output.
 */

export function chatComposerRootAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.root, isDisabled && styles.rootDisabled);
}

/** Note `xstyle` lands on the *body*, not the root — as upstream does. */
export function chatComposerBodyAttrs(
	density: ChatComposerDensity,
	elevation: ChatComposerElevation,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.body,
		density === 'compact' && styles.compact,
		elevationStyles[elevation],
		xstyle
	);
}

export function chatComposerHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.header);
}

export function chatComposerHeaderLeftAttrs(): SvelteStyleAttrs {
	return sx(styles.headerLeft);
}

export function chatComposerHeaderRightAttrs(): SvelteStyleAttrs {
	return sx(styles.headerRight);
}

export function chatComposerInputAreaAttrs(): SvelteStyleAttrs {
	return sx(styles.inputArea);
}

export function chatComposerFooterAttrs(): SvelteStyleAttrs {
	return sx(styles.footer);
}

export function chatComposerFooterLeftAttrs(): SvelteStyleAttrs {
	return sx(styles.footerLeft);
}

export function chatComposerFooterRightAttrs(): SvelteStyleAttrs {
	return sx(styles.footerRight);
}

export function chatComposerStatusBarAttrs(
	statusPosition: 'top' | 'bottom',
	type: 'error' | 'warning'
): SvelteStyleAttrs {
	return sx(
		styles.statusBar,
		statusPosition === 'top' ? styles.statusTop : styles.statusBottom,
		type === 'error' && styles.statusError,
		type === 'warning' && styles.statusWarning
	);
}
