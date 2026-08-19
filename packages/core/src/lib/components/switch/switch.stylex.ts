import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	radiusVars,
	durationVars,
	easeVars,
	typographyVars,
	typeScaleVars,
	focusVars
} from '../../styles/tokens.stylex.js';
import type { SizeValue } from '../../internal/types.js';

/** Switch's size tiers, new in 0.2.0. */
export type SwitchSize = 'sm' | 'md';
import { switchScope } from './switch.markers.stylex.js';

/**
 * `Switch`'s styles, ported from Astryx's `Switch/Switch.tsx`.
 *
 * The track's focus outline and the off/on hover tints are entirely CSS via
 * `when.ancestor(..., switchScope)` — see `switch.markers.stylex.ts` for the
 * marker they resolve against. The dimensions are fixed pixels, transcribed
 * from upstream's constants below.
 */

/**
 * Switch's size tiers, new in 0.2.0. `md` reproduces the previous fixed
 * geometry exactly (40×24, 16px thumb off, 20px on, travel 14px), so the
 * default is unchanged; `sm` is the new 32×20 tier.
 *
 * Six separate groups rather than one, because each lands on a different
 * element (wrapper, hidden input, track, thumb-off, thumb-on, label wrapper)
 * and StyleX requires a static structure per call site — the same reason
 * upstream splits them.
 */
const wrapperSizeStyles = stylex.create({
	sm: { width: 32, height: 20 },
	md: { width: 40, height: 24 }
});

const inputSizeStyles = stylex.create({
	sm: { width: 32, height: 20 },
	md: { width: 40, height: 24 }
});

const trackSizeStyles = stylex.create({
	sm: { width: 32, height: 20, padding: 2 },
	md: { width: 40, height: 24, padding: 4 }
});

const thumbOffSizeStyles = stylex.create({
	sm: { width: 14, height: 14, transform: 'translateX(0)' },
	md: { width: 16, height: 16, transform: 'translateX(0)' }
});

/**
 * The thumb's travel when on — and the one place in this module that needs an
 * explicit RTL branch, since `transform` has no logical form. The thumb rests at
 * the inline-start edge (flex-start, which flexbox already mirrors under RTL);
 * the on-state travel toward the inline-end edge is a physical `translateX`, so
 * it must flip sign under RTL — right in LTR, left in RTL — so the switch
 * mirrors per convention (Material, iOS): off-thumb on the reading-start side,
 * on-thumb on the reading-end.
 *
 * **This divergence has now closed.** At 0.2.0 the pair was followed from the
 * published `dist/` rather than the tagged source: `v0.2.0`'s source had the
 * bare `translateX(12px)` while the 0.2.0 tarball already emitted the
 * `:is([dir="rtl"] *)` branch. That was the *reverse* of the standing "dist lags
 * source" case (Icon's px→rem), and following the source would have shipped a
 * visibly broken RTL switch to satisfy a stale artifact. `v0.3.0`'s source
 * carries the mirrored pair itself (RTL Phase 4c), so source and dist agree and
 * the note is history rather than a live deferral.
 */
const thumbOnSizeStyles = stylex.create({
	sm: {
		width: 16,
		height: 16,
		transform: { default: 'translateX(12px)', ':is([dir="rtl"] *)': 'translateX(-12px)' }
	},
	md: {
		width: 20,
		height: 20,
		transform: { default: 'translateX(14px)', ':is([dir="rtl"] *)': 'translateX(-14px)' }
	}
});

const labelWrapperSizeStyles = stylex.create({
	sm: { minHeight: 20 },
	md: { minHeight: 24 }
});

const styles = stylex.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	// A hidden label is sr-only, so its wrapper is a zero-width flex item — the
	// row gap would still be painted beside the track, making the field box wider
	// than the control it contains. Matches `CheckboxInput`.
	containerLabelHidden: {
		gap: 0
	},
	containerSpread: {
		justifyContent: 'space-between',
		width: '100%'
	},
	statusGap: {
		marginTop: spacingVars['--spacing-2']
	},
	switchWrapper: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0,
		isolation: 'isolate'
	},
	input: {
		position: 'absolute',
		margin: 0,
		padding: 0,
		opacity: 0,
		cursor: 'pointer',
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
		cursor: 'not-allowed'
	},
	inputBusy: {
		pointerEvents: 'none'
	},
	track: {
		display: 'flex',
		alignItems: 'center',
		borderRadius: radiusVars['--radius-full'],
		transitionProperty: 'background-color',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		boxSizing: 'border-box',
		// Forced colors (Windows High Contrast) strips painted backgrounds, which
		// would leave the track invisible. A system-color border keeps the
		// control's bounds perceivable (WCAG 1.4.11).
		borderWidth: {
			default: 0,
			'@media (forced-colors: active)': '1px'
		},
		borderStyle: {
			default: 'none',
			'@media (forced-colors: active)': 'solid'
		},
		borderColor: {
			default: null,
			'@media (forced-colors: active)': 'CanvasText'
		}
	},
	// The one ring in the system not drawn by the shared focus-outline styles. The focusable
	// element is the visually-hidden input, so the ring has to key off a component
	// scope marker — and a marker cannot be shared across components without
	// leaking focus state from an outer one, so it cannot live in the utility.
	// StyleX also cannot inline a constant imported from another module, so the
	// values are read from the tokens the utility reads.
	trackFocus: {
		outline: {
			default: 'none',
			[stylex.when.ancestor(':has(:focus-visible)', switchScope)]:
				`${focusVars['--focus-outline-width']} ${focusVars['--focus-outline-style']} ${focusVars['--focus-outline-color']}`
		},
		outlineOffset: {
			default: null,
			[stylex.when.ancestor(':has(:focus-visible)', switchScope)]:
				focusVars['--focus-outline-offset']
		}
	},
	// State-dependent colors with ancestor hover behavior
	trackOff: {
		backgroundColor: {
			default: colorVars['--color-background-gray'],
			// Off = empty (Canvas) track; on = Highlight track, so the two states
			// stay distinguishable under forced colors.
			'@media (forced-colors: active)': 'Canvas',
			// The ancestor-hover tint is a non-system color-mix, and its rule
			// outranks the plain forced-colors rule above. Left ungated it would
			// reassert on hover under forced colors, where the UA flattens the
			// color-mix back to Canvas — so the HighlightText thumb would sit on a
			// white track (white-on-white). Gating on `forced-colors: none` keeps
			// the tint out of forced colors and lets the system-color track stand.
			[stylex.when.ancestor(':hover', switchScope)]: {
				'@media (hover: hover) and (forced-colors: none)': `color-mix(in srgb, ${colorVars['--color-background-gray']}, ${colorVars['--color-tint-hover']} 5%)`
			}
		}
	},
	trackOn: {
		backgroundColor: {
			default: colorVars['--color-accent'],
			'@media (forced-colors: active)': 'Highlight',
			// See trackOff: gate the hover tint out of forced colors so it cannot
			// flatten the Highlight track to white under the HighlightText thumb.
			[stylex.when.ancestor(':hover', switchScope)]: {
				'@media (hover: hover) and (forced-colors: none)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	trackDisabled: {
		opacity: 0.5,
		// Opacity dimming does not survive forced colors; GrayText is the
		// platform's disabled affordance there.
		borderColor: {
			default: null,
			'@media (forced-colors: active)': 'GrayText'
		}
	},
	trackDisabledOff: {
		backgroundColor: colorVars['--color-background-gray']
	},
	thumb: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radiusVars['--radius-full'],
		transitionProperty: 'transform, width, height',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	// The thumb fill lives on the on/off styles (not the shared thumb style)
	// because forced colors needs a per-state system color: CanvasText on the
	// empty off track, HighlightText on the Highlight on track. Sizing stays in
	// thumbOffSizeStyles/thumbOnSizeStyles; only the fill is state-dependent.
	thumbOff: {
		backgroundColor: {
			default: colorVars['--color-background-surface'],
			'@media (forced-colors: active)': 'CanvasText'
		}
	},
	thumbOn: {
		backgroundColor: {
			default: colorVars['--color-background-surface'],
			'@media (forced-colors: active)': 'HighlightText'
		}
	},

	labelWrapper: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		justifyContent: 'center'
	},
	// Defined by upstream but never applied — the description is rendered by
	// `FieldLabel`, not here. Kept so the compiled atomic classes match dist.
	description: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary']
	}
});

// Dynamic field width (number -> px, string used as-is).
const dynamicWidthStyles = stylex.create({
	width: (width: SizeValue | null) => ({ width })
});

/** The outer field box — dynamic width plus the caller's `xstyle`. */
export function switchFieldAttrs(width: SizeValue | undefined, xstyle: StyleArg): SvelteStyleAttrs {
	return sx(width != null && dynamicWidthStyles.width(width), xstyle);
}

/**
 * The switch *row*. Carries the `switchScope` marker (dropped while disabled)
 * that the track's hover/focus rules resolve against.
 */
export function switchContainerAttrs(
	isSpread: boolean,
	isDisabled: boolean,
	isLabelHidden: boolean
): SvelteStyleAttrs {
	return sx(
		styles.container,
		isLabelHidden && styles.containerLabelHidden,
		isSpread && styles.containerSpread,
		!isDisabled && switchScope
	);
}

/** The positioned wrapper around the native input, track and thumb. */
export function switchWrapperAttrs(size: SwitchSize): SvelteStyleAttrs {
	return sx(styles.switchWrapper, wrapperSizeStyles[size]);
}

/** The visually-transparent native checkbox that owns the interaction. */
export function switchInputAttrs(
	size: SwitchSize,
	isDisabled: boolean,
	isBusy: boolean
): SvelteStyleAttrs {
	return sx(
		styles.input,
		inputSizeStyles[size],
		isDisabled && styles.inputDisabled,
		isBusy && styles.inputBusy
	);
}

/** The pill track, coloured by on/off and dimmed while disabled. */
export function switchTrackAttrs(
	size: SwitchSize,
	isOn: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.track,
		trackSizeStyles[size],
		isOn ? styles.trackOn : styles.trackOff,
		!isDisabled && styles.trackFocus,
		isDisabled && styles.trackDisabled,
		isDisabled && !isOn && styles.trackDisabledOff
	);
}

/** The sliding thumb, which grows and travels when on. */
export function switchThumbAttrs(size: SwitchSize, isOn: boolean): SvelteStyleAttrs {
	return sx(
		styles.thumb,
		isOn ? thumbOnSizeStyles[size] : thumbOffSizeStyles[size],
		isOn ? styles.thumbOn : styles.thumbOff
	);
}

/** The column holding the label and description. */
export function switchLabelWrapperAttrs(size: SwitchSize): SvelteStyleAttrs {
	return sx(styles.labelWrapper, labelWrapperSizeStyles[size]);
}

/**
 * The gap above a detached status message, passed to `FieldStatus`'s `xstyle`.
 *
 * It used to wrap the message in a spacer `<div>`; 0.4.x hands the margin to the
 * message box itself instead, which is one element fewer and — because the value
 * crosses a component boundary — the reason upstream's `dist/` keeps
 * `styles.statusGap` as an object rather than a folded class string.
 */
export const switchStatusGapStyle = styles.statusGap;
