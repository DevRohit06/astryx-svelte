<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus } from '../field/types.js';
	import type { ListDensity } from '../list/list-context.svelte.js';

	/**
	 * `onChange` is a custom callback (not forwarded to an element), so it keeps
	 * upstream's camelCase name; `onchange` (the native handler) is omitted so the
	 * custom one is the whole change API, as upstream's `Omit<BaseProps,
	 * 'onChange'>` intends.
	 */
	export interface CheckboxListProps extends Omit<BaseProps<HTMLDivElement>, 'onchange'> {
		/** Label text for the checkbox group (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed below the label. */
		description?: string;
		/**
		 * Status indicator for the checkbox group.
		 * When set with a message, displays a colored message box below the group.
		 */
		status?: InputStatus;
		/** The currently selected values (collection mode). */
		value?: string[];
		/** Callback fired when the selected values change (collection mode). */
		onChange?: (values: string[]) => void;
		/**
		 * Async action on change. Fires after `onChange`.
		 * While the returned promise is pending, the toggled item shows a spinner
		 * inside its checkbox and is marked `aria-busy`, and re-toggling it is
		 * blocked. Other items remain interactive.
		 */
		changeAction?: (values: string[]) => void | Promise<void>;
		/**
		 * Spacing density for list items.
		 * @default 'balanced'
		 */
		density?: ListDensity;
		/**
		 * Whether to show dividers between list items.
		 * @default false
		 */
		hasDividers?: boolean;
		/**
		 * Whether all checkbox items are disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Explains why the checkbox group is disabled. Applies to the whole-group
		 * disabled state (`isDisabled`), not individual items. When set together
		 * with `isDisabled`, the group shows a tooltip with this text on hover and
		 * keyboard focus, and its checkboxes stay focusable (via `aria-disabled`) so
		 * the reason is discoverable by keyboard and assistive technology. Toggling
		 * stays blocked.
		 *
		 * Use this instead of wrapping a disabled group in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * Whether all checkbox items are read-only.
		 * Displays the current state at full opacity but prevents interaction.
		 * Unlike `isDisabled`, read-only checkboxes are not visually dimmed.
		 * @default false
		 */
		isReadOnly?: boolean;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Checkbox list items to render. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Field from '../field/field.svelte';
	import List from '../list/list.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import { setCheckboxListContext } from './checkbox-list-context.svelte.js';

	/**
	 * A checkbox group for multi-value selection, ported from Astryx's
	 * `CheckboxList/CheckboxList.tsx`.
	 *
	 * Composes `Field` (label, description, status) and `List` (density,
	 * dividers) with a context provider for collection mode. Omitting `value`
	 * leaves the group in *standalone* mode, where each item owns its own
	 * `isChecked`/`onCheck` — that is what the select-all pattern is built on.
	 *
	 * @example
	 * ```svelte
	 * <CheckboxList label="Notifications" value={selected} onChange={(v) => (selected = v)}>
	 *   <CheckboxListItem label="Email" value="email" />
	 *   <CheckboxListItem label="SMS" value="sms" />
	 * </CheckboxList>
	 * ```
	 */
	let {
		label,
		isLabelHidden = false,
		description,
		status,
		value,
		onChange,
		changeAction,
		density = 'balanced',
		hasDividers = false,
		isDisabled = false,
		disabledMessage,
		isReadOnly = false,
		children,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CheckboxListProps = $props();

	// Upstream mints four ids with four `useId` calls plus a fifth inside
	// `useTooltip`. `$props.id()` may be called once per component, so the
	// counterpart is one base id with derived suffixes.
	const uid = $props.id();
	// `inputID` is dead upstream — `isGroupLabel` makes `FieldLabel` drop
	// `htmlFor`, so nothing renders it — but `Field` requires the prop, so it is
	// minted rather than invented a use for.
	const inputID = `${uid}-input`;
	const labelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const tooltipID = `${uid}-tooltip`;

	// Referential stability for the no-value case, as upstream's module-level
	// `EMPTY_ARRAY` gives it.
	const EMPTY_ARRAY: string[] = [];

	const isCollectionMode = $derived(value !== undefined);
	const effectiveValue = $derived(value ?? EMPTY_ARRAY);

	// Upstream holds two `useOptimistic` values — the value array and the pending
	// item — that revert *together* because they share one transition. A single
	// optimistic over the pair is the faithful shape: `createOptimistic` has one
	// override per instance, and two instances could not be driven from one action
	// without either double-invoking `changeAction` or hand-rolling the revert.
	const optimistic = createOptimistic<{ values: string[]; toggled: string | null }>(() => ({
		values: effectiveValue,
		toggled: null
	}));

	// Disabled-reason tooltip. Applies to the whole-group disabled state. Disabled
	// controls swallow pointer events, so the tooltip listeners attach to the group
	// container and the checkboxes stay perceivable via aria-disabled instead of
	// the disabled attribute. Toggling is blocked in the item.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The group container is not naturally focusable; focusin bubbles up from
		// the checkboxes, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	function handleChange(newValues: string[], toggledValue?: string): void {
		// Fired unconditionally — unlike `CheckboxInput`, this has no
		// `defaultPrevented` gate.
		onChange?.(newValues);
		if (changeAction) {
			void optimistic.run({ values: newValues, toggled: toggledValue ?? null }, () =>
				changeAction(newValues)
			);
		}
	}

	// A getter, so an item re-reads a changing value/disabled state where upstream
	// re-renders on the memoised context value. In standalone mode `value` and
	// `onChange` are withheld while the rest still flows, exactly as upstream's
	// `isCollectionMode ? … : undefined` pair does.
	setCheckboxListContext(() => ({
		value: isCollectionMode ? optimistic.current.values : undefined,
		onChange: isCollectionMode ? handleChange : undefined,
		isDisabled,
		hasDisabledMessage: showsDisabledMessage,
		isReadOnly,
		loadingValue: optimistic.current.toggled
	}));

	const groupDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	const theme = themeProps('checkbox-list');
	const fieldStatus = $derived(
		status
			? {
					type: status.type,
					message: status.message,
					messageID: status.message ? statusMessageID : undefined
				}
			: undefined
	);
</script>

<Field
	{...rest}
	{label}
	{isLabelHidden}
	{description}
	{inputID}
	{labelID}
	isGroupLabel
	descriptionID={description ? descriptionID : undefined}
	{isDisabled}
	status={fieldStatus}
	statusVariant="detached"
	{width}
	{xstyle}
	class={cx(theme.class, className)}
	style={styleProp}
>
	<!--
		Anchor + hover/focus listeners for the disabled-message tooltip. Handlers
		are gated internally by `isEnabled`, so attaching unconditionally is safe.
		The group carries no styles of its own — `List` owns the layout.
	-->
	<div
		{@attach disabledMessageTooltip.attachTrigger}
		role="group"
		aria-labelledby={labelID}
		aria-describedby={groupDescribedBy}
	>
		<List {density} {hasDividers}>
			{@render children()}
		</List>
	</div>
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
