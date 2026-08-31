<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { FocusEventHandler } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus } from '../field/types.js';
	// Published from `checkbox-input.stylex.ts`, derived from the size style keys
	// — the arrangement `TextInputSize`/`DropdownMenuSize` use.
	import type { CheckboxInputSize } from './checkbox-input.stylex.js';

	/**
	 * Upstream types this `Omit<BaseProps, 'onChange'>` — the *default* element
	 * parameter (`HTMLElement`), not `HTMLInputElement`, even though `rest` lands
	 * on the `<input>`. Kept as upstream has it: handler parameters are
	 * contravariant, so an `HTMLElement`-typed handler spreads onto an `<input>`
	 * without a cast (it is the reverse direction, as in `ListItem`, that needs
	 * one).
	 *
	 * `onChange` is a custom callback (not forwarded to an element), so it keeps
	 * upstream's camelCase name; `onfocus`/`onblur` *are* forwarded to the native
	 * input, so they take the DOM event name and are omitted from `BaseProps`
	 * first to redeclare narrowed — the rule `TextArea` established. `onchange`
	 * (the native change handler) is omitted so the custom `onChange` is the whole
	 * change API, as upstream's `Omit<BaseProps, 'onChange'>` intends.
	 */
	export interface CheckboxInputProps extends Omit<
		BaseProps<HTMLElement>,
		'onchange' | 'onfocus' | 'onblur'
	> {
		/** Label text for the checkbox (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed below the label. */
		description?: string;
		/** Callback fired when the checkbox state changes. */
		onChange?: (checked: boolean, e: Event) => void;
		/** Async action on change. Fires after `onChange` if not prevented. */
		changeAction?: (checked: boolean, e: Event) => void | Promise<void>;
		/**
		 * Whether the checkbox is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/** Whether the checkbox is checked, unchecked, or indeterminate. */
		value: boolean | 'indeterminate';
		/**
		 * Whether the checkbox is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * The HTML name attribute for the underlying checkbox input.
		 * Useful for form submissions.
		 */
		htmlName?: string;
		/**
		 * Explains why the checkbox is disabled. When set together with
		 * `isDisabled`, the checkbox shows a tooltip with this text on hover and
		 * keyboard focus, and the control stays focusable (via `aria-disabled`) so
		 * the reason is discoverable by keyboard and assistive technology.
		 * Activation stays blocked.
		 *
		 * Use this instead of wrapping a disabled checkbox in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * Whether the checkbox is read-only.
		 * Displays the current state at full opacity but prevents interaction.
		 * Unlike `isDisabled`, read-only checkboxes are not visually dimmed.
		 * @default false
		 */
		isReadOnly?: boolean;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the checkbox is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/**
		 * The size of the checkbox.
		 * - 'sm': Compact size (28px row height)
		 * - 'md': Default size (36px row height)
		 * @default 'md'
		 */
		size?: CheckboxInputSize;
		/** Fired when the checkbox receives focus. */
		onfocus?: FocusEventHandler<HTMLInputElement>;
		/** Fired when the checkbox loses focus. */
		onblur?: FocusEventHandler<HTMLInputElement>;
		/**
		 * Icon to display before the label text.
		 *
		 * Upstream applies `size="sm" color="inherit"` for you; a snippet is
		 * authored by the caller, so set them yourself to match:
		 * `{#snippet labelIcon()}<Icon icon="info" size="sm" color="inherit" />{/snippet}`
		 */
		labelIcon?: Snippet;
		/**
		 * Status indicator for the checkbox.
		 * When set with a message, displays a colored message box below the checkbox.
		 */
		status?: InputStatus;
	}
</script>

<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useCheckboxList } from '../checkbox-list/checkbox-list-context.svelte.js';
	import FieldLabel from '../field/field-label.svelte';
	import FieldStatus from '../field-status/field-status.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import {
		checkboxContainerAttrs,
		checkboxFieldAttrs,
		checkboxIndicatorSlotAttrs,
		checkboxInputAttrs,
		checkboxLabelWrapperAttrs,
		checkboxWrapperAttrs
	} from './checkbox-input.stylex.js';
	import { useIndicator } from '../indicator/use-indicator.svelte.js';
	import { useIndicatorFocusRing } from '../../hooks/use-indicator-focus-ring.svelte.js';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';

	/**
	 * A checkbox input for toggling boolean (or mixed) values, ported from
	 * Astryx's `CheckboxInput/CheckboxInput.tsx`.
	 *
	 * Controlled, as upstream is: `value` in, `onChange` out, with no uncontrolled
	 * fallback. Unlike `Switch`, `value` is **not** `$bindable()` — the third
	 * state (`'indeterminate'`) has no boolean to commit back, and
	 * `CheckboxListItem` drives `value` from the group's array, which a self-write
	 * would desync.
	 *
	 * @example
	 * ```svelte
	 * <CheckboxInput label="Accept terms" value={accepted} onChange={(v) => (accepted = v)} />
	 * <CheckboxInput label="Subscribe" description="Receive weekly updates" value={subscribed} onChange={(v) => (subscribed = v)} />
	 * ```
	 */
	let {
		label,
		isLabelHidden = false,
		description,
		onChange,
		changeAction,
		isLoading = false,
		value,
		isDisabled = false,
		htmlName,
		disabledMessage,
		isReadOnly = false,
		isOptional = false,
		isRequired = false,
		size = 'md',
		onfocus,
		onblur,
		labelIcon,
		status,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CheckboxInputProps = $props();

	// Announce the effective required state (form default included) while the
	// native `required` stays bound to the explicit `isRequired`, so a layout
	// default never switches on browser validation.
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});

	// Upstream mints three ids with three `useId` calls plus a fourth inside
	// `useTooltip`. `$props.id()` may be called once per component, so the
	// counterpart is one base id with derived suffixes — equivalent for
	// uniqueness and SSR/hydration stability.
	const uid = $props.id();
	const id = `${uid}-input`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const tooltipID = `${uid}-tooltip`;

	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.current !== value);

	const isIndeterminate = $derived(optimistic.current === 'indeterminate');
	const isChecked = $derived(optimistic.current === true);

	// Disabled-reason tooltip. Disabled controls swallow pointer events, so the
	// tooltip listeners attach to the checkbox row (which always exists) and the
	// native checkbox stays perceivable via aria-disabled instead of the disabled
	// attribute. Value mutation is blocked by the isDisabled guard in handleChange.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);

	// Keep the native checkbox focusable via aria-disabled either when it renders
	// its own reason tooltip, or when it sits in a CheckboxList whose whole-group
	// `disabledMessage` (shown on the group container) needs each checkbox to stay
	// keyboard-perceivable. The group signals this through context rather than a
	// public prop. Optional by design — `null` for a standalone checkbox.
	const checkboxList = useCheckboxList();
	const isFocusableDisabled = $derived(
		isDisabled && (showsDisabledMessage || (checkboxList?.().hasDisabledMessage ?? false))
	);

	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The container row is not naturally focusable; focusin bubbles up from the
		// native checkbox, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// Build aria-describedby from description, status message and the reason
	// tooltip. Only include descriptionID when the element actually renders —
	// `FieldLabel` renders the description (with descriptionID) even when the
	// label is visually hidden, since it is sr-only, so keep it linked.
	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	/**
	 * Sync the native `indeterminate` DOM property, which cannot be set as an
	 * attribute. On a native checkbox this is the authoritative way to expose the
	 * mixed state — a separate `aria-checked="mixed"` would be redundant and can
	 * desync from (or override) the native state (forms-16), so it is omitted.
	 *
	 * The attachment body reads `isIndeterminate` and nothing else, so it re-runs
	 * exactly when upstream's `useCallback` ref keyed on `[isIndeterminate]`
	 * changes identity — a click that clears the DOM flag without moving `value`
	 * does not re-run it. `syncNativeState` is what restores the flag in that
	 * case; see there for why this port does so and upstream cannot.
	 */
	const attachIndeterminate: Attachment<HTMLInputElement> = (el) => {
		el.indeterminate = isIndeterminate;
	};

	/**
	 * React re-asserts a controlled input's `.checked` from the rendered value on
	 * every change; a Svelte one-way `checked={isChecked}` does not re-run when
	 * `isChecked` is unchanged. Restore that by hand — otherwise a blocked toggle
	 * (disabled-with-a-reason, busy, read-only) or a consumer that ignores
	 * `onChange` would leave the DOM announcing the wrong state. `Switch` records
	 * the same correction.
	 *
	 * `.indeterminate` is restored alongside it, which is a deliberate divergence:
	 * React's restore only knows about `checked` (there is no `indeterminate`
	 * prop — the very reason upstream needs the ref above), so a blocked or
	 * ignored click on a mixed checkbox leaves upstream reporting *unchecked* to
	 * assistive tech while the painted box still shows the dash. Upstream's own
	 * forms-16 comment says the native property is the authoritative mixed-state
	 * signal, so the desync is a bug, and it is documented rather than replicated.
	 */
	function syncNativeState(el: HTMLInputElement): void {
		el.checked = isChecked;
		el.indeterminate = isIndeterminate;
	}

	function handleChange(e: Event): void {
		const el = e.target as HTMLInputElement;
		if (isDisabled || isBusy || isReadOnly) {
			syncNativeState(el);
			return;
		}
		const checked = el.checked;
		onChange?.(checked, e);
		if (changeAction && !e.defaultPrevented) {
			// Optimistic path: the override drives the display and keeps `isBusy`
			// true until the action settles, as upstream's transition does.
			void optimistic.run(checked, () => changeAction(checked, e));
		}
		syncNativeState(el);
	}

	const fieldTheme = $derived(themeProps('checkbox-input', { size }));
	const fieldAttrs = $derived(checkboxFieldAttrs(width, xstyle));
	const containerAttrs = $derived(checkboxContainerAttrs(isLabelHidden, isDisabled));
	const wrapperAttrs = $derived(checkboxWrapperAttrs(size));
	const inputAttrs = $derived(checkboxInputAttrs(size, isDisabled));
	const indicatorSlotAttrs = checkboxIndicatorSlotAttrs();
	const labelWrapperAttrs = checkboxLabelWrapperAttrs();

	// A checkbox's label shares a row with its control, unlike a form field's
	// label above its input. Naming the label rather than the arrangement means a
	// theme asks for the thing it wants, and the component that actually knows
	// what this is says so. It arrives at `FieldLabel` as `class` and composes
	// onto the `astryx-field-label` every label carries — the label itself never
	// names its own placement, so nothing can set this untruthfully.
	const labelTheme = themeProps('checkbox-label');

	// The checkbox visual is a component the theme resolves, not markup this file
	// owns — so it carries its own `checkbox-indicator` theme target, its own
	// state colours and its own size ramp. Resolved once and read reactively, so
	// a `<Theme>` swap changes which component draws.
	const checkboxIndicator = useIndicator('checkbox');
	const CheckboxControl = $derived(checkboxIndicator.current);

	// The focusable `<input>` is `opacity: 0`, so the ring has to be painted on
	// the indicator beside it — and the indicator may be third-party code that
	// never draws one. The owner paints it imperatively instead, on whatever
	// element the indicator actually rendered.
	let indicatorSlot = $state<HTMLElement | null>(null);
	const { focusProps } = useIndicatorFocusRing(() => ({
		container: indicatorSlot,
		isDisabled
	}));
</script>

<div
	{...fieldTheme}
	class={cx(fieldTheme.class, fieldAttrs.class, className)}
	style={mergeStyle(fieldAttrs.style, styleProp as string | undefined)}
>
	<!--
		Interaction (hover/focus) listeners for the disabled-message tooltip attach
		to the whole row for a larger trigger target; positioning anchors on the
		checkbox itself (below) so the tooltip appears next to the control, not the
		far edge of the row. Handlers are gated internally by `isEnabled`, so
		attaching unconditionally is safe.
	-->
	<div
		{@attach disabledMessageTooltip.attachInteraction}
		class={containerAttrs.class}
		style={containerAttrs.style}
	>
		<!--
			`focusin`/`focusout`, not `focus`/`blur`: the focusable element is the
			`<input>` *inside* this wrapper, and the plain events do not bubble.
			Upstream's React `onFocus`/`onBlur` are already delegated-and-bubbling,
			so this is the same wiring under the names the DOM uses — the same
			correction `useKeyboardHint` records.
		-->
		<div
			class={wrapperAttrs.class}
			style={wrapperAttrs.style}
			onfocusin={focusProps.onFocus}
			onfocusout={focusProps.onBlur}
		>
			<!--
				`form=""` detaches the control from its owning form while it is
				disabled-with-a-reason.

				`disabledMessage` deliberately drops the native `disabled` attribute so
				the reason stays focus-discoverable — but `required` is still on the
				element, and an un-disabled required checkbox the user cannot toggle
				fails constraint validation forever: the form can never submit, and the
				browser's "please check this box" bubble points at a control nothing
				can change.

				`form` names the *id* of the form to associate with, and no element can
				have the empty id — so the empty string associates the input with no
				form at all. It leaves constraint validation and form data entirely
				while staying visible, focusable and labelled. Dropping `required`
				instead would let a genuinely required field submit empty once it was
				re-enabled; setting `disabled` would take back the focusability the
				message needs.
			-->
			<input
				{...rest}
				{@attach attachIndeterminate}
				{@attach disabledMessageTooltip.attachPosition}
				{id}
				type="checkbox"
				name={isDisabled ? undefined : htmlName}
				checked={isChecked}
				disabled={isDisabled && !isFocusableDisabled}
				aria-disabled={isFocusableDisabled ? 'true' : undefined}
				form={isFocusableDisabled ? '' : undefined}
				readonly={isReadOnly}
				required={isRequired}
				aria-required={isEffectivelyRequired() ? 'true' : undefined}
				onchange={handleChange}
				{onfocus}
				{onblur}
				aria-readonly={isReadOnly || undefined}
				aria-describedby={ariaDescribedBy}
				aria-invalid={status?.type === 'error' ? 'true' : undefined}
				aria-busy={isBusy || undefined}
				class={inputAttrs.class}
				style={inputAttrs.style}
			/>
			<!--
				A container holding ONLY the indicator, so the focus ring has an
				unambiguous target whatever a theme renders. `display: contents` keeps
				it out of layout entirely.
			-->
			{#snippet busyIndicator()}
				<Spinner size="sm" shade="inherit" />
			{/snippet}
			<span bind:this={indicatorSlot} class={indicatorSlotAttrs.class}>
				<!--
					`children` replaces the state mark but keeps the indicator's place, so
					the row does not shift while a change action is pending. Passed as an
					explicit prop rather than slot content because it is conditional:
					`undefined` when idle is what the indicator's null check reads.
				-->
				<CheckboxControl
					state={isIndeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
					{size}
					{isDisabled}
					children={isBusy ? busyIndicator : undefined}
				/>
			</span>
		</div>
		<div class={labelWrapperAttrs.class} style={labelWrapperAttrs.style}>
			<FieldLabel
				{...labelTheme}
				{label}
				inputID={id}
				{isLabelHidden}
				{isDisabled}
				{isOptional}
				{isRequired}
				{labelIcon}
				{description}
				{descriptionID}
			/>
		</div>
	</div>
	{#if status?.message}
		<FieldStatus
			type={status.type}
			message={status.message}
			id={statusMessageID}
			variant="detached"
		/>
	{/if}
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</div>
