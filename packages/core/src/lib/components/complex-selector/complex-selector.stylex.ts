import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { inputWrapperStyles } from '../field/input-styles.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `ComplexSelector/ComplexSelector.tsx`, where the styles
 * are inline in the component file rather than in a module of their own. The
 * group name (`styles`) is upstream's, so it needs no rename — and the three
 * size keys stay **inside** that group rather than moving to a `sizeStyles` of
 * their own, because upstream indexes them as `styles[size]` and the oracle
 * diffs `dist/`'s object key by key.
 *
 * The declarations read very close to `Selector`'s — same trigger container,
 * same chevron slot — but they are a second, independent copy upstream, not a
 * shared module, so they are transcribed rather than imported. Where the two
 * genuinely differ is worth naming: this trigger carries `borderRadius` (the
 * button is the focus target under `styles.focusRing` rather than borrowing the
 * wrapper's `:focus-within` ring alone), the container has no `variant`, and
 * the popup content is a scrolling `padding: --spacing-3` box instead of a
 * listbox.
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
	triggerIcon: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 16,
		height: 16,
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		transformOrigin: 'center',
		color: colorVars['--color-icon-secondary']
	},
	triggerIconOpen: {
		transform: 'rotate(180deg)'
	},
	popover: {
		minWidth: 'anchor-size(width)',
		marginBlockStart: spacingVars['--spacing-1']
	},
	content: {
		boxSizing: 'border-box',
		maxHeight: 'min(480px, calc(100vh - 32px))',
		overflow: 'auto',
		padding: spacingVars['--spacing-3']
	},
	sm: {
		minHeight: sizeVars['--size-element-sm']
	},
	md: {
		minHeight: sizeVars['--size-element-md']
	},
	lg: {
		minHeight: sizeVars['--size-element-lg']
	},
	disabled: {
		cursor: 'not-allowed'
	},
	focusRing: {
		':focus-within': {
			outline: `2px solid ${colorVars['--color-accent']}`,
			outlineOffset: '2px'
		}
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
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.triggerContainer,
		styles[size],
		styles.focusRing,
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

/** The trailing chevron slot, rotated while the popup is open. */
export function complexSelectorTriggerIconAttrs(isOpen: boolean): SvelteStyleAttrs {
	return sx(styles.triggerIcon, isOpen && styles.triggerIconOpen);
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
