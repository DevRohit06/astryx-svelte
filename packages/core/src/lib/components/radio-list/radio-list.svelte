<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus } from '../field/types.js';
	import type { RadioListSize } from './radio-list-context.svelte.js';

	export interface RadioListProps extends Omit<BaseProps<HTMLElement>, 'onchange'> {
		/** Label for the group (always rendered for accessibility). */
		label: string;
		/** The currently selected value. `''` means nothing is selected. */
		value: string;
		/** Fired when the selection changes. */
		onChange: (value: string) => void;
		/** The `RadioListItem`s. */
		children: Snippet;
		/**
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text below the label. */
		description?: string;
		/**
		 * @default 'vertical'
		 */
		orientation?: 'vertical' | 'horizontal';
		/**
		 * @default false
		 */
		isDisabled?: boolean;
		/** Shared `name` for the radios; auto-generated when omitted. */
		htmlName?: string;
		/**
		 * Why the whole group is disabled, shown in a tooltip. With `isDisabled`,
		 * the radios stay focusable via `aria-disabled` so the reason is keyboard-
		 * discoverable; selection stays blocked.
		 */
		disabledMessage?: string;
		/**
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * @default false
		 */
		isOptional?: boolean;
		/** Validation status for the group. */
		status?: InputStatus;
		/**
		 * @default 'md'
		 */
		size?: RadioListSize;
		/** Width of the whole field (label, controls, status). */
		width?: SizeValue;
		/** Tooltip text shown from an info icon at the end of the label. */
		labelTooltip?: string;
	}
</script>

<script lang="ts">
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Field from '../field/field.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import { setRadioListContext } from './radio-list-context.svelte.js';
	import { radiogroupAttrs } from './radio-list.stylex.js';

	/**
	 * A radio group for single-value selection, wrapped in the `Field` shell.
	 * Items self-register through `RadioListContext` — the group never iterates
	 * its children. Native same-`name` grouping roves the tab stop when a value
	 * is selected; a focus handler makes the no-selection entry deterministic.
	 *
	 * @example
	 * ```svelte
	 * <RadioList label="Notify me by" {value} onChange={(v) => (value = v)}>
	 *   <RadioListItem label="Email" value="email" />
	 *   <RadioListItem label="SMS" value="sms" />
	 * </RadioList>
	 * ```
	 */
	let {
		label,
		value,
		onChange,
		children,
		isLabelHidden = false,
		description,
		orientation = 'vertical',
		isDisabled = false,
		htmlName,
		disabledMessage,
		isRequired = false,
		isOptional = false,
		status,
		size = 'md',
		width,
		labelTooltip,
		class: className,
		style: styleProp,
		xstyle,
		'data-testid': dataTestId
	}: RadioListProps = $props();

	// One base id → the several `useId`s upstream mints, for the reason the
	// neighbouring ports record.
	const uid = $props.id();
	const name = $derived(htmlName ?? `${uid}-name`);
	const inputID = `${uid}-input`;
	const labelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const tooltipID = `${uid}-tooltip`;

	let groupEl = $state<HTMLDivElement | null>(null);

	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The radiogroup container is not naturally focusable; focusin bubbles up
		// from the radios, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	setRadioListContext(() => ({
		name,
		value,
		onChange,
		isDisabled,
		hasDisabledMessage: showsDisabledMessage,
		isRequired,
		size,
		status
	}));

	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	const theme = $derived(themeProps('radio-list', { orientation, size }));
	const groupAttrs = $derived(radiogroupAttrs(orientation));

	/**
	 * Make the tab stop deterministic when the group has no selection. Native
	 * same-`name` radios rove for free once a value is selected, so only the
	 * empty case is corrected — forward entry lands on the first enabled radio,
	 * backward entry on the last, and intra-group movement is never hijacked.
	 * Bound to `onfocusin`, not `onfocus`: React's `onFocus` is the bubbling
	 * focusin, which is what carries focus up from a radio to this container.
	 */
	function handleFocus(e: FocusEvent): void {
		if (value !== '') {
			return;
		}
		const group = groupEl;
		if (!group) {
			return;
		}
		const relatedTarget = e.relatedTarget as Node | null;
		if (relatedTarget) {
			if (group.contains(relatedTarget)) {
				return;
			}
		} else if (
			document.activeElement &&
			document.activeElement !== e.target &&
			group.contains(document.activeElement)
		) {
			return;
		}
		const radios = Array.from(
			group.querySelectorAll<HTMLInputElement>('input[type="radio"]:not([disabled])')
		);
		if (radios.length === 0) {
			return;
		}
		const target = e.target as HTMLElement;
		const targetIndex = radios.findIndex((radio) => radio === target);
		if (targetIndex === -1) {
			return;
		}
		const isBackwardEntry = targetIndex === radios.length - 1;
		const intended = isBackwardEntry ? radios[radios.length - 1] : radios[0];
		if (target !== intended) {
			intended.focus();
		}
	}
</script>

<Field
	data-testid={dataTestId}
	{label}
	{isLabelHidden}
	{description}
	{inputID}
	{labelID}
	isGroupLabel
	descriptionID={description ? descriptionID : undefined}
	{isOptional}
	{isRequired}
	{isDisabled}
	status={status
		? {
				type: status.type,
				message: status.message,
				messageID: status.message ? statusMessageID : undefined
			}
		: undefined}
	{labelTooltip}
	statusVariant="detached"
	{width}
	class={className}
	style={styleProp as string | undefined}
	{xstyle}
>
	<div
		bind:this={groupEl}
		role="radiogroup"
		aria-labelledby={labelID}
		aria-describedby={ariaDescribedBy}
		aria-invalid={status?.type === 'error' ? 'true' : undefined}
		aria-required={isRequired || undefined}
		onfocusin={handleFocus}
		{...theme}
		class={cx(theme.class, groupAttrs.class)}
		style={groupAttrs.style}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		{@render children()}
	</div>
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
