import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import { rtlStyles } from '../../utils/rtl.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * `ResizeHandle`'s styles, ported from Astryx's `ResizeHandle.tsx`.
 *
 * The handle *is* the divider line — 1px in the layout — with a wider
 * absolutely-positioned hit area over it, so the grab zone is comfortable
 * without the separator taking any space.
 */

/** Which side of the divider line the pill grip sits on. */
export type PillPlacement = 'start' | 'end' | 'center' | 'auto';

/**
 * `'auto'` puts the pill on the panel's side, and flips it when the panel
 * collapses to 0px so the grip stays reachable.
 */
export function resolveEffectiveSide(
	pillPlacement: PillPlacement,
	isReversed: boolean,
	isCollapsed: boolean
): 'start' | 'end' | 'center' {
	if (pillPlacement !== 'auto') {
		return pillPlacement;
	}
	const panelSide: 'start' | 'end' = isReversed ? 'end' : 'start';
	if (isCollapsed) {
		return panelSide === 'start' ? 'end' : 'start';
	}
	return panelSide;
}

/**
 * Physical offset direction shared by the pill and the grab zone (`null` =
 * centred / no bias). Keeps the two positioned identically in LTR and RTL.
 *
 * Replaces the old percentage bias (`66.67%`/`33.33%`), which mixed a
 * *divider-relative* `50%` anchor (which flips under RTL) with a **physical**
 * translate (which does not) and stranded the grab zone to one side under RTL.
 * Returning the pill's own `dir` lets the hit area reuse the pill's offset
 * construction, so the two elements can no longer disagree.
 */
function hitAreaBiasDir(effectiveSide: 'start' | 'end' | 'center'): number | null {
	if (effectiveSide === 'center') {
		return null;
	}
	return effectiveSide === 'start' ? -1 : 1;
}

const styles = stylex.create({
	handle: {
		position: 'relative',
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colorVars['--color-border'],
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	// Overlay mode — absolutely positioned inside the parent panel
	// instead of being a sibling in flex flow. Used when the handle
	// must stay within a parent's overflow: clip bounds.
	overlay: {
		position: 'absolute',
		zIndex: 2,
		backgroundColor: 'transparent'
	},
	overlayHorizontal: {
		insetInlineEnd: 0,
		top: 0,
		bottom: 0,
		width: 'var(--resize-handle-hit-area, 16px)'
	},
	overlayVertical: {
		insetBlockEnd: 0,
		insetInlineStart: 0,
		insetInlineEnd: 0,
		height: 'var(--resize-handle-hit-area, 16px)'
	},
	horizontal: {
		width: 1,
		height: '100%',
		cursor: {
			default: 'col-resize',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	vertical: {
		height: 1,
		width: '100%',
		cursor: {
			default: 'row-resize',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	noDividerHorizontal: {
		backgroundColor: 'transparent',
		width: 0
	},
	noDividerVertical: {
		backgroundColor: 'transparent',
		height: 0
	},
	handleHover: {
		backgroundColor: colorVars['--color-border']
	},
	handleActive: {
		backgroundColor: colorVars['--color-border-emphasized']
	},
	disabled: {
		cursor: 'default',
		pointerEvents: 'none'
	},

	hitArea: {
		position: 'absolute',
		zIndex: 1,
		touchAction: 'none',
		userSelect: 'none'
	},
	hitAreaHorizontal: {
		width: spacingVars['--spacing-4'],
		top: 0,
		bottom: 0,
		cursor: {
			default: 'col-resize',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	hitAreaVertical: {
		height: spacingVars['--spacing-4'],
		insetInlineStart: 0,
		insetInlineEnd: 0,
		cursor: {
			default: 'row-resize',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	// Centred grab zone (pillPlacement 'center' / no bias): sit the hit area on
	// the divider itself. Inline centring comes from rtlStyles.centerInline at
	// the call site (correct in LTR and RTL); this block owns only the block axis.
	hitAreaCenteredY: {
		insetBlockStart: '50%',
		transform: 'translateY(-50%)'
	},

	// Pill base — themes target .astryx-resize-handle-pill for size/shape.
	pill: {
		position: 'absolute',
		zIndex: 2,
		pointerEvents: 'none',
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: colorVars['--color-border'],
		transitionProperty: 'opacity, background-color, transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		top: '50%'
	},
	pillHorizontal: {
		width: 3,
		height: spacingVars['--spacing-8']
	},
	pillVertical: {
		width: spacingVars['--spacing-8'],
		height: 3
	},
	pillHidden: { opacity: 0 },
	pillVisible: { opacity: 1 },
	pillHover: {
		opacity: 1,
		backgroundColor: colorVars['--color-border']
	},
	pillActive: {
		opacity: 1,
		backgroundColor: colorVars['--color-border-emphasized']
	}
});

// Dynamic styles — avoids inline style overrides.
// Each axis gets its own function since StyleX requires static structure.
const dynamicStyles = stylex.create({
	// Hit-area inline offset — mirrors the pill's `pillOffsetX`/`pillOffsetY`
	// construction so the grab zone sits centred on the visible pill in BOTH
	// directions. Both anchor at the divider's inline-start edge
	// (`insetInlineStart: 0`) and travel toward the panel side with the SAME
	// physical translate `dir * (gripWidth + gap)`, so they share the pill's
	// near edge. The hit area is wider, so it also shifts by half the width
	// difference `(16px − 3px) / 2 = 6.5px` to align the two CENTRES. That
	// centring shift is along the inline axis (a box grows from its inline-start
	// edge toward inline-end), so it must flip physical sign under RTL — unlike
	// the `dir * (...)` travel, which is physical and identical in both
	// directions because the pill's own offset is physical.
	hitAreaOffsetX: (dir: number) => ({
		insetInlineStart: 0,
		transform: {
			default: `translate(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) - 6.5px), -50%)`,
			':is([dir="rtl"] *)': `translate(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) + 6.5px), -50%)`
		}
	}),
	hitAreaOffsetY: (dir: number) => ({
		insetBlockStart: 0,
		transform: `translate(-50%, calc(${dir} * (3px + ${spacingVars['--spacing-1']}) - 6.5px))`
	}),
	pillOffsetX: (dir: number) => ({
		insetInlineStart: 0,
		transform: `translate(calc(${dir} * (100% + ${spacingVars['--spacing-1']})), -50%)`
	}),
	// Vertical offset: no rotation — use explicit landscape dimensions.
	// Rotation + offset creates confusing coordinate math since translate
	// operates in pre-rotation local space.
	pillOffsetY: (dir: number) => ({
		top: 0,
		transform: `translate(-50%, calc(${dir} * (100% + ${spacingVars['--spacing-1']})))`
	})
});

export interface ResizeHandleAttrsOptions {
	isHorizontal: boolean;
	isOverlay: boolean;
	hasDivider: boolean;
	isInteracting: boolean;
	isDragging: boolean;
	isDisabled: boolean;
}

export function resizeHandleAttrs(
	{
		isHorizontal,
		isOverlay,
		hasDivider,
		isInteracting,
		isDragging,
		isDisabled
	}: ResizeHandleAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.handle,
		isOverlay && styles.overlay,
		isOverlay && (isHorizontal ? styles.overlayHorizontal : styles.overlayVertical),
		!isOverlay && (isHorizontal ? styles.horizontal : styles.vertical),
		!isOverlay &&
			!hasDivider &&
			(isHorizontal ? styles.noDividerHorizontal : styles.noDividerVertical),
		!isOverlay && hasDivider && isInteracting && !isDragging && styles.handleHover,
		!isOverlay && hasDivider && isDragging && styles.handleActive,
		isDisabled && styles.disabled,
		xstyle
	);
}

export function resizeHandleHitAreaAttrs(
	isHorizontal: boolean,
	effectiveSide: 'start' | 'end' | 'center',
	isDisabled: boolean
): SvelteStyleAttrs {
	// Bias the grab zone to sit over the visible pill. When the pill is centred
	// (no bias) just centre the hit area on the divider; when it is offset to a
	// panel side, reuse the pill's physical-offset construction so the two stay
	// aligned in LTR and RTL alike.
	const hitBiasDir = hitAreaBiasDir(effectiveSide);
	return sx(
		styles.hitArea,
		isHorizontal ? styles.hitAreaHorizontal : styles.hitAreaVertical,
		hitBiasDir == null
			? isHorizontal
				? rtlStyles.centerInline('0px')
				: styles.hitAreaCenteredY
			: isHorizontal
				? dynamicStyles.hitAreaOffsetX(hitBiasDir)
				: dynamicStyles.hitAreaOffsetY(hitBiasDir),
		isDisabled && styles.disabled
	);
}

export interface ResizeHandlePillAttrsOptions {
	isHorizontal: boolean;
	effectiveSide: 'start' | 'end' | 'center';
	isAlwaysVisible: boolean;
	isInteracting: boolean;
	isDragging: boolean;
}

export function resizeHandlePillAttrs({
	isHorizontal,
	effectiveSide,
	isAlwaysVisible,
	isInteracting,
	isDragging
}: ResizeHandlePillAttrsOptions): SvelteStyleAttrs {
	return sx(
		styles.pill,
		isHorizontal ? styles.pillHorizontal : styles.pillVertical,
		effectiveSide === 'center'
			? rtlStyles.centerInline('-50%')
			: isHorizontal
				? dynamicStyles.pillOffsetX(effectiveSide === 'start' ? -1 : 1)
				: dynamicStyles.pillOffsetY(effectiveSide === 'start' ? -1 : 1),
		isAlwaysVisible ? styles.pillVisible : styles.pillHidden,
		isInteracting && !isDragging && styles.pillHover,
		isDragging && styles.pillActive
	);
}
