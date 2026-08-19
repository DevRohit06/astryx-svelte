<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { FocusEventHandler } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus } from '../field/types.js';
	import type { SwitchSize as SwitchSizeType } from './switch.stylex.js';

	export type SwitchLabelPosition = 'start' | 'end';

	/** Re-exported so the props type and the barrel agree on one declaration. */
	export type SwitchSize = SwitchSizeType;

	export type SwitchLabelSpacing = 'hug' | 'spread';

	/**
	 * `onChange` is a custom callback (not forwarded to an element), so it keeps
	 * upstream's camelCase name; `onfocus`/`onblur` *are* forwarded to the native
	 * input, so they take the DOM event name and are omitted from `BaseProps`
	 * first to redeclare narrowed — the rule `TextArea` established. `onchange`
	 * (the native change handler) is omitted so the custom `onChange` is the whole
	 * change API, as upstream's `Omit<BaseProps, 'onChange'>` intends.
	 */
	export interface SwitchProps extends Omit<
		BaseProps<HTMLElement>,
		'onchange' | 'onfocus' | 'onblur'
	> {
		/** Label text for the switch (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed below the label. */
		description?: string;
		/** Callback fired when the switch state changes. */
		onChange?: (checked: boolean, e: Event) => void;
		/** Async action on change. Fires after `onChange` if not prevented. */
		changeAction?: (checked: boolean, e: Event) => void | Promise<void>;
		/**
		 * Whether the switch is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/** Whether the switch is on or off. */
		value: boolean;
		/**
		 * Whether the switch is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * The HTML name attribute for the underlying checkbox input.
		 * Useful for form submissions.
		 */
		htmlName?: string;
		/**
		 * Explains why the switch is disabled. When set together with `isDisabled`,
		 * the switch shows a tooltip with this text on hover and keyboard focus, and
		 * the control stays focusable (via `aria-disabled`) so the reason is
		 * discoverable by keyboard and assistive technology. Activation stays
		 * blocked.
		 *
		 * Use this instead of wrapping a disabled switch in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the switch is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Icon to display before the label text.
		 *
		 * Upstream applies `size="sm" color="inherit"` for you; a snippet is
		 * authored by the caller, so set them yourself to match:
		 * `{#snippet labelIcon()}<Icon icon="star" size="sm" color="inherit" />{/snippet}`
		 */
		labelIcon?: Snippet;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Which side of the switch the label appears on.
		 * - 'start': Label appears before the switch
		 * - 'end': Label appears after the switch
		 * @default 'end'
		 */
		labelPosition?: SwitchLabelPosition;
		/**
		 * Spacing behavior between label and switch.
		 * - 'hug': Label and switch are positioned next to each other
		 * - 'spread': Label and switch are pushed to opposite ends
		 * @default 'hug'
		 */
		labelSpacing?: SwitchLabelSpacing;
		/**
		 * Status indicator for the switch.
		 * When set with a message, displays a colored message box below the switch.
		 */
		status?: InputStatus;
		/**
		 * Size variant controlling track and thumb dimensions.
		 * - `sm`: 32×20px (matches the `sm` checkbox/radio vertical rhythm)
		 * - `md`: 40×24px (default, matches the `md` rhythm)
		 * @default 'md'
		 */
		size?: SwitchSize;
		/** Fired when the switch receives focus. */
		onfocus?: FocusEventHandler<HTMLInputElement>;
		/** Fired when the switch loses focus. */
		onblur?: FocusEventHandler<HTMLInputElement>;
	}
</script>

<script lang="ts">
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import FieldLabel from '../field/field-label.svelte';
	import FieldStatus from '../field-status/field-status.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import {
		switchContainerAttrs,
		switchFieldAttrs,
		switchInputAttrs,
		switchLabelWrapperAttrs,
		switchStatusGapStyle,
		switchThumbAttrs,
		switchTrackAttrs,
		switchWrapperAttrs
	} from './switch.stylex.js';

	/**
	 * A toggle switch for boolean values, ported from Astryx's `Switch/Switch.tsx`.
	 *
	 * Controlled, as upstream is: `value` in, `onChange` out. `value` is
	 * `$bindable()`, so `bind:value` works as the idiomatic Svelte spelling of
	 * `value` + `onChange` — additive, leaving upstream's API untouched (both keep
	 * working unbound, as the demo does). As in `TextArea`, the two-way write is
	 * confined to the plain toggle path: with a `changeAction` in flight, `value`
	 * is left uncommitted so the optimistic override drives the display and
	 * `isBusy` — `optimistic.current !== value` — stays true for the action's
	 * duration, exactly as upstream's `useOptimistic` does.
	 *
	 * @example
	 * ```svelte
	 * <Switch label="Enable notifications" bind:value />
	 * <Switch label="Dark mode" description="Switch to a darker color scheme" {value} onChange={(v) => (value = v)} />
	 * ```
	 */
	let {
		label,
		isLabelHidden = false,
		description,
		onChange,
		changeAction,
		isLoading = false,
		value = $bindable(),
		isDisabled = false,
		htmlName,
		disabledMessage,
		isOptional = false,
		isRequired = false,
		labelIcon,
		width,
		labelTooltip,
		labelPosition = 'end',
		labelSpacing = 'hug',
		size = 'md',
		status,
		onfocus,
		onblur,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: SwitchProps = $props();

	// Upstream mints three ids with three `useId` calls plus a fourth inside
	// `useTooltip`. `$props.id()` may be called once per component, so the
	// counterpart is one base id with derived suffixes — equivalent for
	// uniqueness and SSR/hydration stability, and easier to read in the markup.
	const uid = $props.id();
	const id = `${uid}-input`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const tooltipID = `${uid}-tooltip`;

	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.current !== value);
	const isOn = $derived(optimistic.current === true);

	// Disabled-reason tooltip. Disabled controls swallow pointer events, so the
	// tooltip listeners attach to the switch row (which always exists) and the
	// native checkbox stays perceivable via aria-disabled instead of the disabled
	// attribute. Toggling is blocked by the isDisabled guard in handleChange.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The container row is not naturally focusable; focusin bubbles up from
		// the native input, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// Only include descriptionID when the description actually renders. FieldLabel
	// renders it (sr-only) even when the label is visually hidden, so keep it
	// linked. StatusMessage and the disabled-reason tooltip join when present.
	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	function handleChange(e: Event): void {
		if (isDisabled || isBusy) {
			// The control stays focusable while disabled-with-a-reason (via
			// `aria-disabled`, not the native attribute) and during `isBusy`, so a
			// keyboard Space still flips the native checkbox in the DOM even though we
			// block the toggle. React's controlled `checked={isOn}` re-asserts the box
			// on every render; a Svelte one-way `checked={isOn}` does not when `isOn`
			// is unchanged, so re-assert it by hand — otherwise `.checked` (and the
			// `aria-checked` computed from it on `role="switch"`) would announce the
			// wrong state after a blocked toggle.
			(e.target as HTMLInputElement).checked = isOn;
			return;
		}
		const checked = (e.target as HTMLInputElement).checked;
		onChange?.(checked, e);
		if (changeAction && !e.defaultPrevented) {
			// Optimistic path: leave `value` uncommitted so the override drives the
			// display and `isBusy` stays true until the action settles.
			void optimistic.run(checked, () => changeAction(checked, e));
		} else {
			// Plain toggle path: commit the two-way binding so `bind:value` works;
			// for a `value`/`onChange` consumer it is a harmless second write of the
			// value the parent commits through `onChange`.
			value = checked;
		}
	}

	const fieldTheme = $derived(
		themeProps('switch-field', {
			labelPosition: labelPosition !== 'end' ? labelPosition : undefined,
			labelSpacing: labelSpacing !== 'hug' ? labelSpacing : undefined
		})
	);
	const fieldAttrs = $derived(switchFieldAttrs(width, xstyle));
	const containerAttrs = $derived(switchContainerAttrs(labelSpacing === 'spread', isDisabled));
	const wrapperAttrs = $derived(switchWrapperAttrs(size));
	const inputAttrs = $derived(switchInputAttrs(size, isDisabled, isBusy));
	const trackTheme = $derived(
		themeProps('switch', {
			checked: isOn ? 'checked' : null,
			disabled: isDisabled ? 'disabled' : null,
			size
		})
	);
	const trackAttrs = $derived(switchTrackAttrs(size, isOn, isDisabled));
	const thumbTheme = $derived(
		themeProps('switch-thumb', { checked: isOn ? 'checked' : null, size })
	);
	const thumbAttrs = $derived(switchThumbAttrs(size, isOn));
	const labelWrapperAttrs = $derived(switchLabelWrapperAttrs(size));
</script>

<!-- The switch control: transparent native checkbox over the track and thumb. -->
{#snippet switchControl()}
	<div class={wrapperAttrs.class} style={wrapperAttrs.style}>
		<!--
			`form=""` detaches the control from its owning form while it is
			disabled-with-a-reason.

			`disabledMessage` deliberately drops the native `disabled` attribute so
			the reason stays focus-discoverable — but `required` is still on the
			element, and an un-disabled required checkbox the user cannot toggle
			fails constraint validation forever: the form can never submit, and the
			browser's "please check this box" bubble points at a control nothing can
			change.

			`form` names the *id* of the form to associate with, and no element can
			have the empty id — so the empty string associates the input with no form
			at all. It leaves constraint validation and form data entirely while
			staying visible, focusable and labelled. Dropping `required` instead
			would let a genuinely required field submit empty once it was re-enabled;
			setting `disabled` would take back the focusability the message needs.
		-->
		<input
			{id}
			type="checkbox"
			role="switch"
			{@attach disabledMessageTooltip.attachPosition}
			name={isDisabled ? undefined : htmlName}
			checked={isOn}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			form={showsDisabledMessage ? '' : undefined}
			required={isRequired}
			onchange={handleChange}
			{onfocus}
			{onblur}
			aria-describedby={ariaDescribedBy}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			class={inputAttrs.class}
			style={inputAttrs.style}
		/>
		<div
			aria-hidden="true"
			{...trackTheme}
			class={cx(trackTheme.class, trackAttrs.class)}
			style={trackAttrs.style}
		>
			<div {...thumbTheme} class={cx(thumbTheme.class, thumbAttrs.class)} style={thumbAttrs.style}>
				{#if isBusy}<Spinner size="sm" />{/if}
			</div>
		</div>
		{#if isBusy}<VisuallyHidden role="status">Loading</VisuallyHidden>{/if}
	</div>
{/snippet}

{#snippet switchLabel()}
	<div class={labelWrapperAttrs.class} style={labelWrapperAttrs.style}>
		<FieldLabel
			{label}
			inputID={id}
			{isLabelHidden}
			{isDisabled}
			{isOptional}
			{isRequired}
			{labelIcon}
			{labelTooltip}
			{description}
			{descriptionID}
		/>
	</div>
{/snippet}

<div
	{...rest}
	{...fieldTheme}
	class={cx(fieldTheme.class, fieldAttrs.class, className)}
	style={mergeStyle(fieldAttrs.style, styleProp as string | undefined)}
>
	<div
		{@attach disabledMessageTooltip.attachInteraction}
		class={containerAttrs.class}
		style={containerAttrs.style}
	>
		{#if labelPosition === 'start'}
			{@render switchLabel()}
			{@render switchControl()}
		{:else}
			{@render switchControl()}
			{@render switchLabel()}
		{/if}
	</div>
	{#if status?.message}
		<!--
			The gap rides `FieldStatus`'s `xstyle` rather than a spacer `<div>` — one
			element fewer, and the margin lands on the box it spaces.
		-->
		<FieldStatus
			type={status.type}
			message={status.message}
			id={statusMessageID}
			variant="detached"
			xstyle={switchStatusGapStyle}
		/>
	{/if}
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</div>
