<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type {
		SegmentedControlLayout,
		SegmentedControlSize
	} from './segmented-control-context.svelte.js';

	export interface SegmentedControlProps extends Omit<BaseProps<HTMLDivElement>, 'onchange'> {
		/** The currently selected value (controlled). */
		value: string;
		/** Fired when a segment is selected. */
		onChange: (value: string) => void;
		/** Accessible label for the radio group (used as `aria-label`, never rendered). */
		label: string;
		/** @default 'md' */
		size?: SegmentedControlSize;
		/**
		 * - `'hug'` (default): each segment hugs its content width.
		 * - `'fill'`: segments stretch equally to fill the container.
		 * @default 'hug'
		 */
		layout?: SegmentedControlLayout;
		/** @default false */
		isDisabled?: boolean;
		/**
		 * Explains why the whole control is disabled. With `isDisabled`, the control
		 * shows this in a tooltip on hover/focus and stays focusable (via
		 * `aria-disabled`) so the reason is discoverable; selection stays blocked.
		 */
		disabledMessage?: string;
		/** `SegmentedControlItem` children. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useKeyboardHint } from '../../hooks/use-keyboard-hint.svelte.js';
	import KeyboardHintLayer from '../../hooks/keyboard-hint-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { setSegmentedControlContext } from './segmented-control-context.svelte.js';
	import { segmentedControlContainerAttrs } from './segmented-control.stylex.js';

	/**
	 * Segmented button group for single selection (radiogroup semantics). Items
	 * self-register through context; the group never iterates its children.
	 * `useListFocus` owns the roving tab stop and arrow/Home/End navigation, and
	 * selection follows focus (APG radiogroup).
	 *
	 * @example
	 * ```svelte
	 * <SegmentedControl {value} onChange={(v) => (value = v)} label="View mode">
	 *   <SegmentedControlItem value="grid" label="Grid" />
	 *   <SegmentedControlItem value="list" label="List" />
	 * </SegmentedControl>
	 * ```
	 */
	const {
		value,
		onChange,
		label,
		size: sizeProp,
		layout = 'hug',
		isDisabled = false,
		disabledMessage,
		children,
		xstyle,
		class: className,
		style: styleProp,
		onkeydown: onKeyDownProp,
		onfocusin: onFocusProp,
		onfocusout: onBlurProp,
		...rest
	}: SegmentedControlProps = $props();

	const uid = $props.id();
	const hintID = `${uid}-hint`;
	const tooltipID = `${uid}-tooltip`;

	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md') as SegmentedControlSize);

	// Disabled-reason tooltip for the whole-group disabled state. Disabled controls
	// swallow pointer events, so listeners attach to the radiogroup container (which
	// keeps pointer events on in this mode) and selection stays blocked by the guards.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// Roving tabindex + arrow/Home/End navigation across the radios.
	const listFocus = useListFocus(() => ({
		itemSelector: '[role="radio"]:not([aria-disabled="true"])',
		hasRovingTabIndex: true,
		wrap: true,
		orientation: 'horizontal' as const
	}));

	const keyboardHint = useKeyboardHint(() => ({
		id: hintID,
		orientation: 'horizontal' as const,
		isEnabled: !isDisabled
	}));

	setSegmentedControlContext(() => ({
		value,
		onChange,
		size,
		layout,
		isDisabled,
		hasDisabledMessage: showsDisabledMessage
	}));

	const theme = $derived(themeProps('segmented-control', { size }));
	const containerAttrs = $derived(
		segmentedControlContainerAttrs({ size, layout, isDisabled, showsDisabledMessage }, xstyle)
	);

	function handleContainerKeyDown(e: KeyboardEvent): void {
		onKeyDownProp?.(e as KeyboardEvent & { currentTarget: HTMLDivElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onKeyDown(e);
		listFocus.handleKeyDown(e);
	}

	// Selection-follows-focus (APG radiogroup): useListFocus only *moves* focus, so
	// when it lands focus on a new radio we select that radio's value — but only for
	// focus moving WITHIN the group. A Tab entering from outside stays a pure focus
	// move so an unmatched/disabled-selected value doesn't get rewritten on traversal.
	function handleContainerFocus(e: FocusEvent): void {
		onFocusProp?.(e as FocusEvent & { currentTarget: HTMLDivElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onFocus(e);
		listFocus.handleFocus(e);
		if (isDisabled) {
			return;
		}
		const currentTarget = e.currentTarget as HTMLElement;
		if (!currentTarget.contains(e.relatedTarget as Node | null)) {
			return;
		}
		const focused = (e.target as HTMLElement | null)?.closest<HTMLElement>(
			'[role="radio"][data-value]'
		);
		if (!focused || focused.getAttribute('aria-disabled') === 'true') {
			return;
		}
		const nextValue = focused.dataset.value;
		if (nextValue != null && nextValue !== value) {
			onChange(nextValue);
		}
	}

	function handleContainerBlur(e: FocusEvent): void {
		onBlurProp?.(e as FocusEvent & { currentTarget: HTMLDivElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onBlur(e);
	}
</script>

<div
	{...rest}
	{@attach listFocus.attachList}
	{@attach disabledMessageTooltip.attachTrigger}
	role="radiogroup"
	aria-label={label}
	aria-disabled={isDisabled || undefined}
	aria-describedby={showsDisabledMessage ? disabledMessageTooltip.describedBy : undefined}
	onkeydown={handleContainerKeyDown}
	onfocusin={handleContainerFocus}
	onfocusout={handleContainerBlur}
	{...theme}
	class={cx(theme.class, containerAttrs.class, className)}
	style={mergeStyle(containerAttrs.style, styleProp as string | undefined)}
>
	{@render children()}
	<KeyboardHintLayer hint={keyboardHint} />
</div>
{#if showsDisabledMessage && disabledMessage}
	<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
{/if}
