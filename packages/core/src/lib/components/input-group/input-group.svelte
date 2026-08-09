<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { InputStatus } from '../field/types.js';
	// `InputGroupSize` is published from `input-group.stylex.ts`, where it is
	// derived from the size style keys — the arrangement `TextAreaSize` uses.
	import type { InputGroupSize } from './input-group.stylex.js';

	export interface InputGroupProps extends Omit<BaseProps<HTMLDivElement>, 'children'> {
		/** The member controls and addons — `TextInput`, `InputGroupText`, … */
		children: Snippet;
		/** Label naming the whole group (via `aria-labelledby`, never `aria-label`). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed between the label and the group. */
		description?: string;
		/**
		 * Whether the whole group is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Whether the group is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the group is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Size of the members. Inherited from an enclosing `SizeContext` when unset,
		 * and cascaded down to the members through one.
		 * @default 'md'
		 */
		size?: InputGroupSize;
		/** Validation status, rendered as a border, an icon and an optional message. */
		status?: InputStatus;
		/** Tooltip text shown from an info icon at the end of the label. */
		labelTooltip?: string;
	}
</script>

<script lang="ts">
	import { setSizeContext, useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Field from '../field/field.svelte';
	import { setInputGroupContext } from './input-group-context.svelte.js';
	import { inputGroupAttrs } from './input-group.stylex.js';

	/**
	 * Joins several input controls into one bordered unit — a currency field, a
	 * URL with scheme and TLD addons, a phone number with a country prefix. The
	 * group owns the label and description; the members read those through
	 * `InputGroupContext` and drop their own `Field` shell, so the whole unit is
	 * announced as a single labelled group.
	 *
	 * @example
	 * ```svelte
	 * <InputGroup label="Website">
	 *   <InputGroupText>https://</InputGroupText>
	 *   <TextInput label="Domain" bind:value />
	 *   <InputGroupText>.com</InputGroupText>
	 * </InputGroup>
	 * ```
	 */
	let {
		children,
		label,
		isLabelHidden = false,
		description,
		isDisabled = false,
		isOptional = false,
		isRequired = false,
		size: sizeProp,
		status,
		labelTooltip,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: InputGroupProps = $props();

	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	// Four independent ids from one base — the counterpart to upstream's four
	// `useId` calls, for the same reason the `TextArea` port gives: `$props.id()`
	// is callable once, and derived suffixes are stable across SSR/hydration and
	// easier to read than four opaque ids.
	const uid = $props.id();
	const inputId = `${uid}-input`;
	const labelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;

	const describedByIDs = $derived(
		[description ? descriptionID : null, status?.message ? statusMessageID : null]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Provide both contexts as getters so a member reading `describedByIDs` or the
	// inherited size re-runs when they change. `setSizeContext` stands in for
	// upstream's `SizeProvider`, cascading the resolved size to the members.
	setInputGroupContext(() => ({ isInGroup: true, labelID, describedByIDs }));
	setSizeContext(() => size);

	const theme = $derived(themeProps('input-group', { size, status: status?.type ?? null }));
	const groupAttrs = $derived(inputGroupAttrs(size, isDisabled, xstyle));
</script>

<Field
	{label}
	{isLabelHidden}
	{description}
	inputID={inputId}
	{labelID}
	descriptionID={description ? descriptionID : undefined}
	isGroupLabel
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
	statusVariant="detached"
	{labelTooltip}
>
	<div
		{...rest}
		role="group"
		aria-labelledby={labelID}
		aria-describedby={describedByIDs}
		{...theme}
		class={cx(theme.class, groupAttrs.class, className)}
		style={mergeStyle(groupAttrs.style, styleProp as string | undefined)}
	>
		{@render children()}
	</div>
</Field>
