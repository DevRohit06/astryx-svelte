import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { inputWrapperStyles } from '../field/input-styles.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `ComplexSelector/ComplexSelector.tsx`, where the styles
 * are inline in the component file rather than in a module of their own. The
 * group name (`styles`) is upstream's, so it needs no rename — and the three
 * size keys stay **inside** that group rather than moving to a `sizeStyles` of
 * their own, because upstream indexes them as `styles[size]` and the oracle
 * diffs `dist/`'s object key by key.
 *
 * The declarations read very close to `Selector`'s — same trigger container,
 * same chevron glyph — but they are a second, independent copy upstream, not a
 * shared module, so they are transcribed rather than imported. Where the two
 * genuinely differ is worth naming: this trigger carries `borderRadius`, the
 * container has no `variant`, and the popup content is a scrolling
 * `padding: --spacing-3` box instead of a listbox.
 *
 * **There is no local focus ring.** This module used to declare one
 * (`:focus-within { outline: 2px solid accent; outline-offset: 2px }`), which
 * was the CSS oracle's invented `.x1oqel4m:focus-within` / `.x1fanpfn` pair.
 * 0.4.x consolidated every ring into `focusOutlineStyles` (#4935, #4973), and
 * `focusWithin` there is `:has(:focus-visible)` — so it is also a *keyboard*
 * ring, where the old one drew on a mouse click too.
 */

const styles = stylex.create({
	triggerContainer: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		width: '100%',
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-label-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-label-size']})`
		},
		lineHeight: typeScaleVars['--text-label-leading'],
		color: colorVars['--color-text-primary'],
		cursor: 'pointer'
	},
	trigger: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 0,
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		lineHeight: 'inherit',
		color: 'inherit',
		cursor: 'pointer',
		outline: 'none',
		borderRadius: radiusVars['--radius-element']
	},
	triggerText: {
		flexGrow: 1,
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		textAlign: 'start'
	},
	placeholder: {
		color: colorVars['--color-text-secondary']
	},
	// Only what Icon does not already provide: `sm` gives the 16px box and
	// `color="secondary"` the color, but the glyph still must not shrink inside
	// the flex trigger.
	triggerIcon: {
		flexShrink: 0
	},
	// Rotation lives on the chevron glyph itself (passed through `xstyle`), not
	// on the layout wrapper above, so the icon's
	// `complex-selector-indicator-icon` theme target and the open/closed
	// transform sit on one element — a theme can restyle the mark and its
	// rotation through a single selector. The wrapper keeps only layout.
	triggerIconRotation: {
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		transformOrigin: 'center'
	},
	triggerIconOpen: {
		transform: 'rotate(180deg)'
	},
	popover: {
		minWidth: 'anchor-size(width)'
	},
	content: {
		boxSizing: 'border-box',
		maxHeight: 'min(480px, calc(100vh - 32px))',
		overflow: 'auto',
		padding: spacingVars['--spacing-3']
	},
	sm: {
		height: sizeVars['--size-element-sm']
	},
	md: {
		height: sizeVars['--size-element-md']
	},
	lg: {
		height: sizeVars['--size-element-lg']
	},
	// The ghost trigger drops the field chrome for a toolbar-button treatment:
	// no border, no shadow, a hover/press wash painted as a background image so it
	// composites over whatever surface it sits on.
	triggerGhost: {
		width: 'auto',
		borderWidth: 0,
		backgroundColor: 'transparent',
		backgroundImage: {
			default: null,
			':hover': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			},
			':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`
		},
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within)': {
				'@media (hover: hover)': 'none'
			},
			':focus-within': 'none'
		},
		fontWeight: fontWeightVars['--font-weight-medium'],
		transitionProperty: 'background-image, background-color, color, opacity, transform',
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.98)'
		}
	},
	triggerGhostDisabled: {
		backgroundImage: 'none',
		transform: {
			default: 'none',
			':active': 'none'
		}
	},
	disabled: {
		cursor: 'not-allowed'
	}
});

/**
 * Trigger and field size.
 *
 * Declared here rather than in `complex-selector.svelte` because
 * `complexSelectorTriggerContainerAttrs` indexes the size styles with it — the
 * same arrangement `SelectorSize` and `MultiSelectorSize` take. Upstream
 * declares it in `ComplexSelector.tsx` beside the styles it gates, and spells
 * it out as a union rather than deriving it from a group, so this does too:
 * `sm`/`md`/`lg` share the group with every other key here.
 */
export type ComplexSelectorSize = 'sm' | 'md' | 'lg';

/** Visual trigger style. Ghost matches toolbar buttons. */
export type ComplexSelectorVariant = 'input' | 'ghost';

/**
 * The bordered surface wrapping the trigger button, spinner and chevron.
 *
 * `hasTriggerLabel` is upstream's `triggerLabel == null` test: the placeholder
 * colour applies to the *container*, not to the text span, so it has to be
 * decided here rather than where the text renders.
 */
export function complexSelectorTriggerContainerAttrs(
	size: ComplexSelectorSize,
	isDisabled: boolean,
	hasTriggerLabel: boolean,
	variant: ComplexSelectorVariant,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.triggerContainer,
		styles[size],
		variant === 'ghost' && styles.triggerGhost,
		variant === 'ghost' && isDisabled && styles.triggerGhostDisabled,
		// The ring belongs to the wrapper (the focusable `<button>` sits inside
		// it), but it must still be a KEYBOARD ring: `:focus-within` matched a
		// mouse click on the trigger and drew the outline for pointer users too.
		// `focusWithin` here is `:has(:focus-visible)`.
		focusOutlineStyles.focusWithin,
		isDisabled && inputWrapperStyles.disabled,
		isDisabled && styles.disabled,
		!hasTriggerLabel && styles.placeholder,
		xstyle
	);
}

/** The `aria-haspopup="dialog"` button itself. */
export function complexSelectorTriggerAttrs(): SvelteStyleAttrs {
	return sx(styles.trigger);
}

/** The truncating label span inside the trigger. */
export function complexSelectorTriggerTextAttrs(): SvelteStyleAttrs {
	return sx(styles.triggerText);
}

/**
 * `xstyle` for the chevron glyph: the no-shrink rule, the rotation transition,
 * and the flip while open. Handed to `Icon` so one element carries the mark, its
 * transform and the `complex-selector-indicator-icon` theme target.
 */
export function complexSelectorChevronXstyle(isOpen: boolean): StyleArg {
	return [styles.triggerIcon, styles.triggerIconRotation, isOpen && styles.triggerIconOpen];
}

/** The scrolling popup content box the render snippet fills. */
export function complexSelectorContentAttrs(contentXstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.content, contentXstyle);
}

/**
 * `xstyle` for the layer container — upstream's `[styles.popover,
 * layerAnimations[placement]]`, whose second half the caller appends.
 */
export const complexSelectorPopoverStyle: StyleArg = styles.popover;

/**
 * The system's standard menu clearance, passed to `<PopoverLayer offset>`
 * (#4951). It replaces the `marginBlockStart` this module used to bake into
 * `popover`, which a `position-try-fallbacks` flip would have applied to the
 * wrong edge. A token cannot be read from a `.svelte` file, so it is re-exported
 * here — the arrangement `powerSearchPopoverOffset` settled.
 */
export const complexSelectorPopoverOffset: string = spacingVars['--spacing-1'];
