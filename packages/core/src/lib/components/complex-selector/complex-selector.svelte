<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	// `ComplexSelectorSize` is published from `complex-selector.stylex.ts`, where
	// the attrs function that indexes the size styles lives — the arrangement
	// `SelectorSize`/`MultiSelectorSize` use. The barrel re-exports it from there.
	import type { ComplexSelectorSize } from './complex-selector.stylex.js';

	/**
	 * What the content snippet is told about the shell around it. Upstream's
	 * fourth render-prop argument, unchanged.
	 */
	export interface ComplexSelectorRenderState {
		/** Whether the selector surface is open. */
		isOpen: boolean;
		/** Whether changeAction/isLoading is pending. */
		isBusy: boolean;
		/** ID of the trigger button. */
		triggerId: string;
		/** ID of the popup content container. */
		contentId: string;
	}

	export interface ComplexSelectorStatus {
		type: 'warning' | 'error' | 'success';
		message?: string;
	}

	/**
	 * `onchange` stands in for upstream's `Omit<…, 'onChange'>`: the native
	 * handler is spread onto the trigger container through the rest props, so it
	 * has to go for the same reason it does on `Selector` and `NumberInput`.
	 * `children` is already absent from this port's `BaseProps`, and is named
	 * anyway so the omit list reads as upstream's — the same redundancy
	 * `FieldProps` keeps.
	 *
	 * `placeholder` is the omission upstream has no counterpart for, the same
	 * standing `LayoutProps.content` has. React's `HTMLAttributes` carries no
	 * `placeholder`, so upstream had nothing to strip; Svelte's does (typed
	 * `string | null`), and this component's `placeholder` is upstream's
	 * `ReactNode` — `string | Snippet` here — which widens it. Every other
	 * `placeholder` in the port is a plain `string` and needs no omit; this is
	 * the first `ReactNode` one.
	 */
	export interface ComplexSelectorProps<Value> extends Omit<
		BaseProps<HTMLDivElement>,
		'children' | 'onchange' | 'placeholder'
	> {
		/** Label text for accessibility and the field label. */
		label: string;
		/** Current controlled value. */
		value: Value;
		/** Called when custom content commits a new value. */
		onChange?: (value: Value) => void;
		/** Optional async action after onChange; drives optimistic UI. */
		changeAction?: (value: Value) => void | Promise<void>;
		/**
		 * Custom selector surface content rendered inside a dialog popover.
		 *
		 * Upstream's render prop, which a **parameterised snippet** translates
		 * directly: the four arguments arrive in upstream's order, and the caller
		 * only renders with them — the state they describe is owned here, not in
		 * the snippet, which is what makes a snippet right rather than a sibling
		 * component module.
		 */
		children: Snippet<[Value, (value: Value) => void, () => void, ComplexSelectorRenderState]>;
		/** Label/content shown in the closed trigger. */
		triggerLabel?: string | Snippet;
		/** Placeholder shown when triggerLabel is omitted. */
		placeholder?: string | Snippet;
		/** Whether to visually hide the field label. */
		isLabelHidden?: boolean;
		/** Helper text displayed below the label. */
		description?: string;
		/** Marks the field optional. */
		isOptional?: boolean;
		/** Marks the field required. */
		isRequired?: boolean;
		/** Disables the selector. */
		isDisabled?: boolean;
		/** Shows loading state on the trigger. */
		isLoading?: boolean;
		/** Validation status. */
		status?: ComplexSelectorStatus;
		/** Status placement. */
		statusVariant?: FieldStatusVariant;
		/** Tooltip text displayed next to the label. */
		labelTooltip?: string;
		/** Trigger and field size. */
		size?: ComplexSelectorSize;
		/** Width of the field. */
		width?: SizeValue;
		/** Popup placement. */
		placement?: 'above' | 'below' | 'start' | 'end';
		/** StyleX styles for the popup content container. */
		contentXstyle?: StyleArg;
		/** Test ID for the trigger container. */
		'data-testid'?: string;
	}
</script>

<script lang="ts" generics="Value">
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import Spinner from '../spinner/spinner.svelte';
	import {
		complexSelectorContentAttrs,
		complexSelectorPopoverStyle,
		complexSelectorTriggerAttrs,
		complexSelectorTriggerContainerAttrs,
		complexSelectorTriggerIconAttrs,
		complexSelectorTriggerTextAttrs
	} from './complex-selector.stylex.js';

	/**
	 * A selector shell for rich, custom selection surfaces.
	 *
	 * ComplexSelector owns the field, trigger, popover, focus restore, and async
	 * change action flow. Consumers provide the dialog content as a snippet,
	 * using the supplied `value`, `onChange`, and `close` helpers to compose the
	 * right accessible structure for the custom selector.
	 *
	 * **Strictly controlled — `value` is deliberately not `$bindable()`**, for the
	 * reason `Selector` records: upstream never writes it back, and a local commit
	 * would leave a caller who omits `onChange` stuck on a value the shell chose
	 * for them.
	 *
	 * The `useTransition` + `useOptimistic` pair behind `changeAction` is
	 * `createOptimistic`, as in every other `*Action` component here.
	 *
	 * @example
	 * ```svelte
	 * <ComplexSelector
	 *   label="Fruit"
	 *   {value}
	 *   onChange={(next) => (value = next)}
	 *   triggerLabel={`${value.fruit} ${value.ripeness}`}
	 * >
	 *   {#snippet children(current, onChange, close)}
	 *     <FruitGrid
	 *       value={current}
	 *       onChange={(next) => {
	 *         onChange(next);
	 *         close();
	 *       }}
	 *     />
	 *   {/snippet}
	 * </ComplexSelector>
	 * ```
	 */
	const {
		label,
		value,
		onChange,
		changeAction,
		children,
		triggerLabel,
		placeholder: placeholderFromProps,
		isLabelHidden = false,
		description,
		isOptional = false,
		isRequired = false,
		isDisabled = false,
		isLoading = false,
		status,
		statusVariant = 'attached',
		labelTooltip,
		size = 'md',
		width,
		placement = 'below',
		contentXstyle,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: ComplexSelectorProps<Value> = $props();

	const t = useTranslator();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.selector.placeholder'));

	// One base id with derived suffixes — the counterpart to upstream's five
	// `useId` calls, plus one more the port needs: the layer's own id, which
	// upstream's `useLayer` mints internally and ours must be handed.
	const uid = $props.id();
	const triggerId = `${uid}-trigger`;
	const labelId = `${uid}-label`;
	const contentId = `${uid}-content`;
	const descriptionId = `${uid}-description`;
	const statusMessageId = `${uid}-status`;
	const popoverId = `${uid}-popover`;

	const ariaDescribedBy = $derived(
		[description ? descriptionId : null, status?.message ? statusMessageId : null]
			.filter((id): id is string => id != null)
			.join(' ') || undefined
	);

	const optimistic = createOptimistic<Value>(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);

	// `hasCloseButton: false` and the default `role: 'dialog'` are upstream's;
	// `dialogLabel` names the dialog from the field label, which is also what
	// keeps `usePopover`'s unnamed-dialog warning quiet.
	//
	// `onHide` restores focus by id rather than through a bound element, exactly
	// as upstream does — the trigger is inside this component, but reaching it the
	// same way keeps the restore working when the button is re-created (a `size`
	// change re-runs the class merge, not the element, but the id lookup is
	// indifferent either way).
	const popover = usePopover(() => ({
		id: popoverId,
		dialogLabel: label,
		hasCloseButton: false,
		hasAutoFocus: true,
		onHide: () => {
			document.getElementById(triggerId)?.focus();
		}
	}));

	function commitValue(nextValue: Value): void {
		onChange?.(nextValue);
		if (changeAction) {
			void optimistic.run(nextValue, () => changeAction(nextValue));
		}
	}

	const triggerContent = $derived(triggerLabel ?? placeholder);

	const renderState = $derived<ComplexSelectorRenderState>({
		isOpen: popover.isOpen,
		isBusy,
		triggerId,
		contentId
	});

	function handleTriggerKeyDown(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown' && !popover.isOpen && !isDisabled) {
			event.preventDefault();
			popover.show();
		}
	}

	const theme = $derived(themeProps('complex-selector', { size, status: status?.type ?? null }));
	const containerAttrs = $derived(
		complexSelectorTriggerContainerAttrs(size, isDisabled, triggerLabel != null, xstyle)
	);
	const triggerAttrs = complexSelectorTriggerAttrs();
	const triggerTextAttrs = complexSelectorTriggerTextAttrs();
	const triggerIconAttrs = $derived(complexSelectorTriggerIconAttrs(popover.isOpen));
	const contentAttrs = $derived(complexSelectorContentAttrs(contentXstyle));
	const layerXstyle = $derived([complexSelectorPopoverStyle, layerAnimations[placement]]);
</script>

{#snippet selectorContent()}
	<!--
		The container is the click target and the popover anchor. It is not
		focusable and carries no role: the `aria-haspopup="dialog"` button inside it
		is the control, and the click handler exists only to widen the hit area over
		the padding, spinner and chevron — every one of which sits inside the same
		trigger the button already exposes to keyboard users. Same shape, and the
		same reasoning, as `Selector`'s container.
	-->
	<div
		{@attach popover.attachTrigger}
		data-testid={testId}
		{...rest}
		onclick={() => {
			if (!isDisabled) {
				popover.toggle();
			}
		}}
		{...theme}
		class={cx(theme.class, containerAttrs.class, className)}
		style={mergeStyle(containerAttrs.style, styleProp as string | undefined)}
	>
		<!--
			`aria-required` and `aria-invalid` are not in `role="button"`'s supported
			set, and Svelte says so. They are upstream's own markup: this trigger
			stands in for a form control, and upstream carries both so the field's
			required/error state is exposed somewhere. Replicated, not corrected —
			the same standing `DateRangeInput`'s trigger has.
		-->
		<!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
		<button
			id={triggerId}
			type="button"
			aria-haspopup="dialog"
			aria-expanded={popover.isOpen}
			aria-controls={contentId}
			aria-describedby={ariaDescribedBy}
			aria-labelledby={labelId}
			aria-required={isRequired ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			disabled={isDisabled}
			onkeydown={handleTriggerKeyDown}
			class={triggerAttrs.class}
			style={triggerAttrs.style}
		>
			<span class={triggerTextAttrs.class} style={triggerTextAttrs.style}>
				<!-- A Snippet is a function; anything else is text. -->
				{#if typeof triggerContent === 'function'}{@render triggerContent()}{:else}{triggerContent}{/if}
			</span>
		</button>
		{#if isBusy}
			<Spinner size="sm" />
		{/if}
		<span class={triggerIconAttrs.class} style={triggerIconAttrs.style}>
			<!--
				Stable theme target on the chevron itself, carrying its open/closed
				state as `data-state`, so a theme can restyle just this glyph.
			-->
			<Icon
				icon="chevronDown"
				size="sm"
				color="inherit"
				{...themeProps('complex-selector-indicator-icon', {
					state: popover.isOpen ? 'expanded' : 'collapsed'
				})}
			/>
		</span>
	</div>

	<!--
		Upstream's `popover.render(content, {placement, alignment: 'start', xstyle})`.
		`aria-controls` on the trigger points at THIS div rather than the layer
		wrapper, which is upstream's wiring — the same exception `Selector` makes.
	-->
	<PopoverLayer {popover} {placement} alignment="start" xstyle={layerXstyle}>
		<div id={contentId} class={contentAttrs.class} style={contentAttrs.style}>
			{@render children(optimistic.current, commitValue, popover.hide, renderState)}
		</div>
	</PopoverLayer>
{/snippet}

<Field
	{label}
	{isLabelHidden}
	{description}
	inputID={triggerId}
	descriptionID={description ? descriptionId : undefined}
	labelID={labelId}
	{isOptional}
	{isRequired}
	{isDisabled}
	status={status
		? {
				type: status.type,
				message: status.message,
				messageID: status.message ? statusMessageId : undefined
			}
		: undefined}
	{statusVariant}
	{labelTooltip}
	{width}
>
	{@render selectorContent()}
</Field>
