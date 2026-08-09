import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { container, type SpacingToken } from '../../internal/container.stylex.js';
import type { SpacingStep } from '../../internal/types.js';
import {
	paddingStyles,
	containerPaddingInlineVarStyles,
	containerPaddingBlockStartVarStyles,
	containerPaddingBlockEndVarStyles
} from '../../internal/padding.stylex.js';
import {
	colorVars,
	radiusVars,
	durationVars,
	easeVars,
	shadowVars
} from '../../styles/tokens.stylex.js';

const enterDirectional = stylex.keyframes({
	from: {
		opacity: 0,
		transform: 'translate(var(--dialog-dir-x, 0px), var(--dialog-dir-y, 16px)) scale(0.95)'
	},
	to: { opacity: 1, transform: 'translate(0, 0) scale(1)' }
});

const styles = stylex.create({
	dialog: {
		position: 'fixed',
		margin: 'auto',
		padding: 0,
		border: 'none',
		backgroundColor: colorVars['--color-background-surface'],
		'--_dialog-radius': radiusVars['--radius-container'],
		borderRadius: 'var(--_dialog-radius)',
		boxShadow: shadowVars['--shadow-high'],
		display: 'none',
		flexDirection: 'column',
		height: 'fit-content',
		overscrollBehavior: 'contain',
		opacity: 0,
		animationDuration: durationVars['--duration-medium-max'],
		animationTimingFunction: easeVars['--ease-standard'],
		animationFillMode: 'backwards',
		outline: {
			default: null,
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':focus-visible': '2px'
		}
	},
	// Applied via isOpen prop — avoids :where([open]) attribute selectors
	// which have zero specificity and can lose to default styles depending
	// on CSS source order in the build output.
	open: {
		display: 'flex',
		opacity: 1,
		// Disable the entry keyframe animation under
		// `prefers-reduced-motion: reduce` so the dialog appears instantly
		// instead of translating/scaling in (same pattern as layerAnimations).
		animationName: {
			default: enterDirectional,
			'@media (prefers-reduced-motion: reduce)': 'none'
		}
	},
	// Backdrop using ::backdrop pseudo-element
	backdrop: {
		'::backdrop': {
			backgroundColor: colorVars['--color-overlay'],
			backdropFilter: 'blur(2px)'
		}
	},
	fullscreen: {
		width: '100dvw',
		height: '100dvh',
		maxWidth: '100dvw',
		maxHeight: '100dvh',
		borderRadius: 0,
		margin: 0,
		inset: 0
	},
	inner: {
		display: 'flex',
		flexDirection: 'column',
		flex: '1 1 auto',
		minHeight: 0,
		overflow: 'hidden',
		borderRadius: 'inherit'
	},
	// Inline wrapper mirrors the dialog's visual styles without <dialog> behavior
	inlineWrapper: {
		padding: 0,
		border: 'none',
		backgroundColor: colorVars['--color-background-surface'],
		'--_dialog-radius': radiusVars['--radius-container'],
		borderRadius: 'var(--_dialog-radius)',
		boxShadow: shadowVars['--shadow-high'],
		display: 'flex',
		flexDirection: 'column',
		height: 'fit-content',
		overscrollBehavior: 'contain'
	}
});

// Dynamic styles for width, maxHeight, and position
const dynamicStyles = stylex.create({
	sizing: (width: number | string, maxHeight: number | string) => ({
		width: typeof width === 'number' ? `${width}px` : width,
		maxWidth: '90vw',
		maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
	}),
	position: (top: string, insetInlineStart: string, insetInlineEnd: string, bottom: string) => ({
		// Assigns pre-resolved offsets from `resolveDialogPositionOffsets`. This
		// literal has no logic — StyleX can't analyze a helper, so the values
		// (logical start/end → inset-inline-*, `auto` fallbacks) are computed at
		// the call site and passed in. `margin: 0` disables the centering auto
		// margin so the offsets take effect.
		margin: 0,
		top,
		insetInlineStart,
		insetInlineEnd,
		bottom
	})
});

/** Numbers become pixels, strings pass through. */
function formatPosition(value: number | string): string {
	return typeof value === 'number' ? `${value}px` : value;
}

/** Block-axis offsets — always allowed, independent of inline direction. */
interface DialogBlockPosition {
	top?: number | string;
	bottom?: number | string;
}

/**
 * Static position for a dialog. Inline offsets are logical only:
 * - Logical `start`/`end` map to `inset-inline-*` and mirror under RTL.
 *
 * Block-axis `top`/`bottom` may be combined with either.
 *
 * Upstream 0.3.0 **removed** the physical `left`/`right` fields this port
 * carried through 0.2.0 — see the note on `resolveDialogPositionOffsets`.
 */
export interface DialogPosition extends DialogBlockPosition {
	/** Logical inline-start offset (`inset-inline-start`); mirrors under RTL. */
	start?: number | string;
	/** Logical inline-end offset (`inset-inline-end`); mirrors under RTL. */
	end?: number | string;
}

/**
 * Map a {@link DialogPosition} to resolved CSS offsets. Logical `start`/`end`
 * become `inset-inline-*` (mirror under RTL); each unset offset falls back to
 * `auto`.
 *
 * Not re-exported from the package barrel; internal to `Dialog`, exactly as
 * upstream keeps it out of `Dialog/index.ts`. Directly unit-tested so the
 * mapping is verified without StyleX class compilation.
 *
 * @see DialogPosition
 */
export function resolveDialogPositionOffsets(position: DialogPosition): {
	top: string;
	bottom: string;
	insetInlineStart: string;
	insetInlineEnd: string;
} {
	const { top, bottom, start, end } = position;

	return {
		top: top !== undefined ? formatPosition(top) : 'auto',
		bottom: bottom !== undefined ? formatPosition(bottom) : 'auto',
		// Logical offsets mirror under RTL (preferred replacements).
		insetInlineStart: start !== undefined ? formatPosition(start) : 'auto',
		insetInlineEnd: end !== undefined ? formatPosition(end) : 'auto'
	};
}

export interface DialogRootOptions {
	isOpen: boolean;
	isFullscreen: boolean;
	width: number | string;
	maxHeight: number | string;
	/** Only applied when set and not fullscreen. */
	position?: Readonly<DialogPosition>;
	xstyle?: StyleArg;
}

/** The `<dialog>` element in the standard modal path. */
export function dialogAttrs({
	isOpen,
	isFullscreen,
	width,
	maxHeight,
	position,
	xstyle
}: DialogRootOptions): SvelteStyleAttrs {
	// Upstream resolves the offsets at the `stylex.props` call site (an IIFE) for
	// the reason its comment on `dynamicStyles.position` gives: StyleX cannot
	// analyze a helper, so the literal must receive finished strings.
	const offsets = position != null && !isFullscreen ? resolveDialogPositionOffsets(position) : null;
	return sx(
		styles.dialog,
		isOpen && styles.open,
		styles.backdrop,
		!isFullscreen && dynamicStyles.sizing(width, maxHeight),
		offsets != null &&
			dynamicStyles.position(
				offsets.top,
				offsets.insetInlineStart,
				offsets.insetInlineEnd,
				offsets.bottom
			),
		isFullscreen && styles.fullscreen,
		xstyle
	);
}

export interface DialogInlineOptions {
	isFullscreen: boolean;
	width: number | string;
	maxHeight: number | string;
	xstyle?: StyleArg;
}

/** The `<div>` wrapper in the inline (docs preview) path. */
export function dialogInlineAttrs({
	isFullscreen,
	width,
	maxHeight,
	xstyle
}: DialogInlineOptions): SvelteStyleAttrs {
	return sx(
		styles.inlineWrapper,
		!isFullscreen && dynamicStyles.sizing(width, maxHeight),
		isFullscreen && styles.fullscreen,
		xstyle
	);
}

export interface DialogInnerOptions {
	/** When true, cascade padding from the dialog theme default. */
	useThemeDefault: boolean;
	paddingToken: SpacingToken;
	effectivePadding: SpacingStep;
	/** Undefined when fullscreen. */
	maxHeight: string | undefined;
}

/** The inner content wrapper — the padding/max-height container. */
export function dialogInnerAttrs({
	useThemeDefault,
	paddingToken,
	effectivePadding,
	maxHeight
}: DialogInnerOptions): SvelteStyleAttrs {
	const explicit = !useThemeDefault && effectivePadding !== 4;
	return sx(
		styles.inner,
		...container(
			useThemeDefault
				? { useThemeDefault: 'dialog', maxHeight }
				: {
						paddingInnerX: paddingToken,
						paddingInnerY: paddingToken,
						paddingOuterX: paddingToken,
						paddingOuterY: paddingToken,
						maxHeight
					}
		),
		explicit && paddingStyles[effectivePadding],
		explicit && containerPaddingInlineVarStyles[effectivePadding],
		explicit && containerPaddingBlockStartVarStyles[effectivePadding],
		explicit && containerPaddingBlockEndVarStyles[effectivePadding]
	);
}
