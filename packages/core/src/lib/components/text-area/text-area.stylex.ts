import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	inputStatusBorderStyles,
	inputStatusFocusWithinStyles,
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from '../field/input-styles.stylex.js';
import type { InputStatusType } from '../field/types.js';
import {
	colorVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TextArea/TextArea.tsx`.
 *
 * The wrapper builds on `Field`'s shared `inputWrapperStyles` rather than
 * restating the border/focus/hover chrome, which is what those groups exist for.
 */

/**
 * Below this fraction of `maxLength` the counter stays silent, so a screen
 * reader is not told the remaining count on every keystroke.
 */
export const COUNTER_WARNING_THRESHOLD = 0.8;

const styles = stylex.create({
	// The wrapper is a bare positioning context. The <textarea> spans the full
	// container and carries its own internal padding; icons, status/spinner, and
	// the character counter are absolutely-positioned overlays anchored to the
	// container corners. This keeps the native resize grip in the true
	// bottom-right corner and lets the scrollbar represent the full input area.
	wrapper: {
		zIndex: 1,
		display: 'block',
		// Zero the shared wrapper inset with matching longhands, not the `padding`
		// shorthand: StyleX ranks longhands above shorthands regardless of merge
		// order, so a `padding: 0` shorthand loses to the base's
		// paddingBlock/paddingInline. The wrapper would keep a duplicate inset that
		// the <textarea>'s own padding then doubles — insetting the text and
		// pushing the native resize grip in from the corner.
		paddingBlock: 0,
		paddingInline: 0,
		// Internal inline padding for the textarea's text. Defined on the wrapper
		// so the counter (a sibling overlay) inherits the same value and stays
		// aligned with the text edge. Kept as an internal var so it can later be
		// driven by a theme "padding" translation without touching either child.
		'--_textarea-inline-padding': spacingVars['--spacing-2']
	},
	textarea: {
		display: 'block',
		width: '100%',
		boxSizing: 'border-box',
		minWidth: 0,
		borderWidth: 0,
		borderStyle: 'none',
		// Base internal padding; overlays get their own reserved space below.
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: 'var(--_textarea-inline-padding)',
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			// A coarse pointer means a touch device, where a sub-16px font makes
			// mobile Safari zoom the viewport on focus.
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		outline: 'none',
		'::placeholder': {
			color: colorVars['--color-text-secondary']
		},
		resize: 'vertical'
	},
	textareaDisabled: {
		cursor: 'default'
	},
	// Reserve start padding so text clears the start icon.
	// inline inset + 16px icon (sm) + 8px gap
	textareaWithStartIcon: {
		paddingInlineStart: `calc(var(--_textarea-inline-padding) + ${spacingVars['--spacing-6']})`
	},
	// Reserve end padding so text clears the status icon / spinner overlay. Only
	// applied when the end slot actually renders something (spinner or on-field
	// status glyph) — the `detached` status variant suppresses the on-field icon,
	// its glyph living in the message box below, so reserving here would inset the
	// text for an icon that never appears.
	// inline inset + 20px icon (md) + 4px gap
	textareaWithStatus: {
		paddingInlineEnd: `calc(var(--_textarea-inline-padding) + ${spacingVars['--spacing-6']})`
	},
	// Reserve wider end padding when the spinner AND status icon both show.
	// inline inset + 16px spinner + 8px gap + 20px icon + 4px gap
	textareaWithBusyStatus: {
		paddingInlineEnd: `calc(var(--_textarea-inline-padding) + ${spacingVars['--spacing-12']})`
	},
	// Reserve bottom padding so text clears the character counter overlay.
	//
	// `paddingBottom` rather than `paddingBlockEnd` is upstream's spelling and is
	// load-bearing: StyleX gives the physical longhand a higher specificity level
	// than `paddingBlock`, so it wins over the base `paddingBlock` above. The
	// logical spelling compiles to a different atomic class at a lower level and
	// would lose the cascade. The block axis does not flip under RTL either way.
	// (`astryx/no-physical-properties` bans only the inline-axis pairs, so no
	// disable is needed here.)
	textareaWithCounter: {
		paddingBottom: spacingVars['--spacing-7']
	},
	startIcon: {
		position: 'absolute',
		top: spacingVars['--spacing-2'],
		insetInlineStart: 'var(--_textarea-inline-padding)',
		pointerEvents: 'none',
		display: 'flex'
	},
	endSlot: {
		position: 'absolute',
		top: spacingVars['--spacing-2'],
		insetInlineEnd: 'var(--_textarea-inline-padding)',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	// Character counter lives inside the input container, anchored bottom-right
	// underneath the textarea, aligned to the same inline inset as the text.
	counter: {
		position: 'absolute',
		bottom: spacingVars['--spacing-1'],
		insetInlineEnd: 'var(--_textarea-inline-padding)',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	counterError: {
		color: colorVars['--color-error']
	}
});

/**
 * `sm` and `md` are deliberately empty — upstream declares them so
 * `textareaSizeStyles[size]` can be indexed unconditionally, and the compiler
 * emits nothing for them.
 */
const textareaSizeStyles = stylex.create({
	sm: {},
	md: {},
	lg: {
		paddingBlock: spacingVars['--spacing-2']
	}
});

export type TextAreaSize = keyof typeof textareaSizeStyles;

/** The bordered surface: input chrome, click-to-focus host and tooltip anchor. */
export function textAreaWrapperAttrs(
	statusType: InputStatusType | undefined,
	isDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.wrapper,
		isDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		xstyle
	);
}

/**
 * The `<textarea>` itself. It spans the whole container, so the space taken by
 * the overlays is reserved as padding rather than by a flex row.
 */
export function textAreaAttrs(
	size: TextAreaSize,
	isDisabled: boolean,
	hasStartIcon: boolean,
	hasEndSlot: boolean,
	hasBusyStatus: boolean,
	hasCounter: boolean
): SvelteStyleAttrs {
	return sx(
		styles.textarea,
		textareaSizeStyles[size],
		isDisabled && styles.textareaDisabled,
		hasStartIcon && styles.textareaWithStartIcon,
		hasEndSlot && styles.textareaWithStatus,
		hasBusyStatus && styles.textareaWithBusyStatus,
		hasCounter && styles.textareaWithCounter
	);
}

/** The start-icon overlay, anchored to the container's start edge. */
export function textAreaStartIconAttrs(): SvelteStyleAttrs {
	return sx(styles.startIcon);
}

/** The spinner + status glyph overlay, anchored to the container's end edge. */
export function textAreaEndSlotAttrs(): SvelteStyleAttrs {
	return sx(styles.endSlot);
}

/** The character counter, anchored to the container's bottom-end corner. */
export function textAreaCounterAttrs(isOverLimit: boolean): SvelteStyleAttrs {
	return sx(styles.counter, isOverLimit && styles.counterError);
}
