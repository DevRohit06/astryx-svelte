import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { rtlStyles } from '../../utils/rtl.stylex.js';
import {
	colorVars,
	spacingVars,
	radiusVars,
	durationVars,
	easeVars,
	typographyVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * `Slider`'s styles, ported from Astryx's `Slider/Slider.tsx`.
 *
 * Every positional value — thumb offset, filled-track extent, mark placement —
 * is a plain inline `style`, not a StyleX dynamic style, so this module only
 * carries the static geometry. There is no `defineMarker` either: the thumb's
 * hover and focus rules are element-local (`:hover` / `:focus-visible`), unlike
 * `Switch`/`CheckboxInput`, whose rules key off an ancestor row.
 */

const TRACK_SIZE = 4;
/**
 * Exported because the component needs the same number for its thumb-travel
 * geometry. Upstream is one file, so it reads a module-private const; the split
 * here means the number has to cross the module boundary rather than be written
 * down twice.
 */
export const THUMB_SIZE = 20;

const styles = stylex.create({
	sliderRow: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	trackContainer: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		flexGrow: 1,
		touchAction: 'none',
		userSelect: 'none',
		isolation: 'isolate'
	},
	trackContainerHorizontal: {
		height: THUMB_SIZE,
		// The whole track is the tap target (a click anywhere on it moves the
		// slider), but it is only THUMB_SIZE (20px) tall — under the WCAG 2.5.8 AA
		// 24px minimum. Floor its block size to 24px on touch pointers only. The
		// rail and thumb center on 50%, so they stay put; only the invisible
		// tappable area grows. Desktop (fine pointer) is unchanged.
		minBlockSize: {
			default: null,
			'@media (pointer: coarse)': '24px'
		},
		width: '100%',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	trackContainerVertical: {
		width: THUMB_SIZE,
		height: 160,
		// Same tap target, rotated: the vertical track is the thing you press, and
		// it is only THUMB_SIZE (20px) wide. `minBlockSize` above floors the
		// horizontal track's short axis; here the short axis is the inline one
		// (the block size is already 160px), so floor that instead. The rail,
		// fill, marks and thumb all center on the inline 50%, so they stay put;
		// only the invisible tappable area grows. Desktop is unchanged.
		minInlineSize: {
			default: null,
			'@media (pointer: coarse)': '24px'
		},
		flexDirection: 'column',
		justifyContent: 'center',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	trackContainerDisabled: {
		opacity: 0.5,
		cursor: 'default'
	},
	track: {
		position: 'absolute',
		backgroundColor: colorVars['--color-track'],
		borderRadius: radiusVars['--radius-full']
	},
	trackHorizontal: {
		insetInlineStart: 0,
		insetInlineEnd: 0,
		height: TRACK_SIZE,
		top: '50%',
		transform: 'translateY(-50%)'
	},
	trackVertical: {
		top: 0,
		bottom: 0,
		width: TRACK_SIZE
	},
	filledTrack: {
		position: 'absolute',
		backgroundColor: colorVars['--color-accent'],
		borderRadius: radiusVars['--radius-full']
	},
	filledTrackHorizontal: {
		height: TRACK_SIZE,
		top: '50%',
		transform: 'translateY(-50%)'
	},
	filledTrackVertical: {
		width: TRACK_SIZE
	},
	thumb: {
		position: 'absolute',
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: colorVars['--color-accent'],
		transform: 'translate(-50%, -50%)',
		transitionProperty: 'background-color, box-shadow',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		outline: 'none',
		cursor: {
			default: 'grab',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		zIndex: 1
	},
	thumbHorizontal: {
		top: '50%',
		// The thumb is positioned via logical `insetInlineStart`, which resolves
		// from the right edge under RTL. The centering translate is a physical
		// (screen-space) transform, so it must flip its X direction under RTL to
		// keep the thumb centered on the value point.
		transform: {
			default: 'translate(-50%, -50%)',
			':is([dir="rtl"] *)': 'translate(50%, -50%)'
		}
	},
	thumbHover: {
		backgroundColor: {
			default: colorVars['--color-accent'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	thumbDisabled: {
		backgroundColor: colorVars['--color-background-muted'],
		cursor: 'default'
	},
	textValue: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary'],
		whiteSpace: 'nowrap',
		flexShrink: 0
	},
	marksContainer: {
		position: 'absolute'
	},
	marksContainerHorizontal: {
		insetInlineStart: 0,
		insetInlineEnd: 0,
		top: '50%'
	},
	marksContainerVertical: {
		top: 0,
		bottom: 0,
		insetInlineStart: '50%'
	},
	mark: {
		position: 'absolute',
		backgroundColor: colorVars['--color-border-emphasized'],
		borderRadius: radiusVars['--radius-full']
	},
	markHorizontal: {
		width: 2,
		height: 8,
		transform: {
			default: 'translate(-50%, -50%)',
			':is([dir="rtl"] *)': 'translate(50%, -50%)'
		}
	},
	markVertical: {
		height: 2,
		width: 8,
		transform: 'translate(-50%, 50%)'
	},
	markLabel: {
		position: 'absolute',
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary'],
		whiteSpace: 'nowrap'
	},
	markLabelHorizontal: {
		transform: {
			default: 'translateX(-50%)',
			':is([dir="rtl"] *)': 'translateX(50%)'
		},
		top: THUMB_SIZE / 2 + 4
	},
	markLabelVertical: {
		transform: 'translateY(50%)',
		insetInlineStart: THUMB_SIZE / 2 + 4
	}
});

/** The flex row holding the track container and the optional text readout. */
export function sliderRowAttrs(): SvelteStyleAttrs {
	return sx(styles.sliderRow);
}

/** The positioned, pointer-handling box the track, marks and thumbs sit in. */
export function sliderTrackContainerAttrs(
	isHorizontal: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.trackContainer,
		isHorizontal ? styles.trackContainerHorizontal : styles.trackContainerVertical,
		isDisabled && styles.trackContainerDisabled
	);
}

/**
 * The unfilled rail. The vertical branch centres on the inline axis through
 * `rtlStyles.centerInline`, which upstream composes at the JSX call site; here
 * the attrs function is that call site. It replaced a local
 * `insetInlineStart: '50%'` + `translateX(-50%)` pair that was off-centre by the
 * rail's own width under RTL — see the helper's header.
 */
export function sliderTrackAttrs(isHorizontal: boolean): SvelteStyleAttrs {
	return sx(
		styles.track,
		isHorizontal ? styles.trackHorizontal : [styles.trackVertical, rtlStyles.centerInline('0px')]
	);
}

/** The accent-filled portion of the rail; its extent is an inline style. */
export function sliderFilledTrackAttrs(isHorizontal: boolean): SvelteStyleAttrs {
	return sx(
		styles.filledTrack,
		isHorizontal
			? styles.filledTrackHorizontal
			: [styles.filledTrackVertical, rtlStyles.centerInline('0px')]
	);
}

/** The absolutely-positioned box the marks are placed within. */
export function sliderMarksContainerAttrs(isHorizontal: boolean): SvelteStyleAttrs {
	return sx(
		styles.marksContainer,
		isHorizontal ? styles.marksContainerHorizontal : styles.marksContainerVertical
	);
}

/** A single tick; its offset along the rail is an inline style. */
export function sliderMarkAttrs(isHorizontal: boolean): SvelteStyleAttrs {
	return sx(styles.mark, isHorizontal ? styles.markHorizontal : styles.markVertical);
}

/** A tick's caption; its offset along the rail is an inline style. */
export function sliderMarkLabelAttrs(isHorizontal: boolean): SvelteStyleAttrs {
	return sx(styles.markLabel, isHorizontal ? styles.markLabelHorizontal : styles.markLabelVertical);
}

/** The `valueDisplay="text"` readout beside the track. */
export function sliderTextValueAttrs(): SvelteStyleAttrs {
	return sx(styles.textValue);
}

/**
 * A draggable thumb. `thumbDisabled`'s plain `backgroundColor` replaces
 * `thumbHover`'s whole conditional group, which is why the disabled variants
 * collapse to the same atomic classes whether or not the hover key is applied.
 */
export function sliderThumbAttrs(isHorizontal: boolean, isDisabled: boolean): SvelteStyleAttrs {
	return sx(
		styles.thumb,
		isHorizontal ? styles.thumbHorizontal : rtlStyles.centerInline('50%'),
		!isDisabled && styles.thumbHover,
		!isDisabled && focusOutlineStyles.focusVisible,
		isDisabled && styles.thumbDisabled
	);
}
