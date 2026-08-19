<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';

	/**
	 * A second, independent declaration of the status union — upstream has both
	 * this and `InputStatusType` in `Field/types.ts`, and exports each. The
	 * duplication is upstream's shape, not drift.
	 */
	export type FieldStatusType = 'warning' | 'error' | 'success';

	export interface FieldStatusInput {
		/** The type of status to display. */
		type: FieldStatusType;
		/** Optional message to display below the input. */
		message?: string;
		/** ID for the status message element (use for aria-describedby on the input). */
		messageID?: string;
	}

	export interface FieldProps extends Omit<BaseProps<HTMLDivElement>, 'children'> {
		/** Label text for the field (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label and description (still accessible to
		 * screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/**
		 * Description text displayed between the label and input.
		 * Hidden when isLabelHidden is true.
		 */
		description?: string;
		/**
		 * ID of the input element this label points AT (used as the label's
		 * `for`). This is the id of the *control*, not of the label element —
		 * see `labelID` for the latter.
		 */
		inputID: string;
		/**
		 * The `id` applied TO the label element itself (distinct from `inputID`,
		 * which is the control the label points at). A grouping control
		 * (radiogroup, checkbox group) references this via `aria-labelledby` to take
		 * the label as its accessible name. Pair with `isGroupLabel`.
		 */
		labelID?: string;
		/**
		 * When the field wraps a group of controls rather than a single input, set
		 * this so the label renders as a non-`<label>` element (a `<span>`): a
		 * `<label>` semantically names one control and can't be associated with a
		 * group. Pair with `labelID` + `aria-labelledby` on the group.
		 * @default false
		 */
		isGroupLabel?: boolean;
		/** ID for the description element (use for aria-describedby on the input). */
		descriptionID?: string;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Whether the associated input is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Icon to display before the label text.
		 *
		 * Upstream applies `size="sm" color="inherit"` for you; a snippet is
		 * authored by the caller, so set them yourself to match:
		 * `{#snippet labelIcon()}<Icon icon="star" size="sm" color="inherit" />{/snippet}`
		 */
		labelIcon?: Snippet;
		/**
		 * Status indicator for the field.
		 * When set with a message, displays a colored message box below the input.
		 */
		status?: FieldStatusInput;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * How the status message is rendered relative to the input.
		 * - `attached`: Status sits directly below the input (default, for bordered inputs)
		 * - `detached`: Status is a separate element below the field (for checkboxes, switches, sliders)
		 * - `tooltip`: No message box; the input surfaces status through a tooltip on its on-field icon
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field — label, control, and status — so
		 * the control and its surrounding chrome stay aligned. Prefer this over
		 * setting `width` via `class`/`style`, which only size the inner control box
		 * and leave the label and status at their natural width.
		 */
		width?: SizeValue;
		/** The input or control to render inside the field. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useFormLayout } from '../form-layout/form-layout-context.svelte.js';
	import FieldStatus from '../field-status/field-status.svelte';
	import Text from '../text/text.svelte';
	import FieldLabel from './field-label.svelte';
	import {
		fieldContainerAttrs,
		fieldHorizontalLabelAlignAttrs,
		fieldHorizontalLabelsAttrs,
		fieldInputStatusWrapperAttrs
	} from './field.stylex.js';

	/**
	 * A form field wrapper that provides label and description.
	 *
	 * It does not wire `aria-describedby` for you — it *publishes* the ids
	 * (`descriptionID`, `status.messageID`, or ones derived from `inputID`) and
	 * the control you nest inside references them.
	 *
	 * @example
	 * ```svelte
	 * <Field label="Email" description="We'll never share your email" inputID="email" descriptionID="email-desc">
	 *   <input id="email" aria-describedby="email-desc" />
	 * </Field>
	 * ```
	 */
	const {
		label,
		isLabelHidden = false,
		description,
		inputID,
		labelID,
		isGroupLabel = false,
		descriptionID,
		isOptional = false,
		isRequired = false,
		isDisabled = false,
		labelIcon,
		status,
		labelTooltip,
		statusVariant = 'attached',
		width,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: FieldProps = $props();

	// A getter read at call time, so a `FormLayout` that changes direction after
	// mount moves its fields with it.
	const formLayout = useFormLayout();
	const isHorizontalLabels = $derived(formLayout().direction === 'horizontal-labels');

	const resolvedDescriptionID = $derived(
		descriptionID ?? (description ? `${inputID}-desc` : undefined)
	);
	const resolvedMessageID = $derived(
		status?.messageID ?? (status?.message ? `${inputID}-status` : undefined)
	);

	// Upstream's `useDevWarning`, whose effect + latch warns once per mount and
	// re-checks when the props change into the bad combination after it.
	useDevWarning(
		'Field',
		'isOptional and isRequired are mutually exclusive. isOptional takes precedence.',
		() => isOptional && isRequired
	);

	// `themeProps` and the align wrapper take constant arguments, so they are
	// plain consts; the two root attrs read `xstyle` (and `containerAttrs` also
	// `isLabelHidden`/`width`), so they are `$derived`.
	const horizontalTheme = themeProps('field', { layout: 'horizontal-labels' });
	const horizontalAttrs = $derived(fieldHorizontalLabelsAttrs(xstyle));
	const labelAlignAttrs = fieldHorizontalLabelAlignAttrs();

	const theme = themeProps('field');
	const containerAttrs = $derived(fieldContainerAttrs(isLabelHidden, width, xstyle));

	const wrapperAttrs = fieldInputStatusWrapperAttrs();
</script>

{#snippet labelNode()}
	<FieldLabel
		{label}
		{inputID}
		{labelID}
		{isGroupLabel}
		{isLabelHidden}
		{isDisabled}
		{isOptional}
		{isRequired}
		{labelIcon}
		{labelTooltip}
		description={isHorizontalLabels ? undefined : description}
		descriptionID={isHorizontalLabels ? undefined : resolvedDescriptionID}
	/>
{/snippet}

{#snippet statusNode()}
	<!--
		The `tooltip` variant surfaces status through the input's on-field icon
		tooltip, so `Field` renders no message box for it.
	-->
	{#if status?.message && statusVariant !== 'tooltip'}
		<FieldStatus
			type={status.type}
			message={status.message}
			id={resolvedMessageID}
			variant={statusVariant}
		/>
	{/if}
{/snippet}

{#if isHorizontalLabels}
	<!--
		Horizontal-labels mode. `display: contents` lets the parent grid's
		`auto 1fr` columns place the label in column 1 and the input group in
		column 2. Description and status are grouped with the input in column 2.
		The label wrapper gets top padding to align label text with input text.
	-->
	<div
		{...horizontalTheme}
		{...rest}
		class={cx(horizontalTheme.class, horizontalAttrs.class, className)}
		style={mergeStyle(horizontalAttrs.style, styleProp as string | undefined)}
	>
		<div class={labelAlignAttrs.class} style={labelAlignAttrs.style}>
			{@render labelNode()}
		</div>
		<div class={wrapperAttrs.class} style={wrapperAttrs.style}>
			{#if description}
				<Text type="supporting" display="block" id={resolvedDescriptionID}>{description}</Text>
			{/if}
			{@render children()}
			{@render statusNode()}
		</div>
	</div>
{:else}
	<!-- Default mode (vertical / horizontal). -->
	<div
		{...theme}
		{...rest}
		class={cx(theme.class, containerAttrs.class, className)}
		style={mergeStyle(containerAttrs.style, styleProp as string | undefined)}
	>
		{@render labelNode()}
		{#if statusVariant === 'attached'}
			<div class={wrapperAttrs.class} style={wrapperAttrs.style}>
				{@render children()}
				{@render statusNode()}
			</div>
		{:else}
			{@render children()}
			{@render statusNode()}
		{/if}
	</div>
{/if}
