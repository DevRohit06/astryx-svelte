<script lang="ts">
	import Field from '$lib/components/field/field.svelte';
	import type { FieldProps } from '$lib/components/field/field.svelte';
	import {
		setFormLayoutContext,
		type FormLayoutDirection
	} from '$lib/components/form-layout/form-layout-context.svelte.js';

	/**
	 * A `Field` around the control upstream writes inline as JSX children, plus
	 * the layout context its `horizontal-labels` cases wrap it in.
	 *
	 * Two things a test case cannot do for itself: author a snippet, and set a
	 * Svelte context above the component under test. Upstream's
	 * `<FormLayoutContext value={{direction: 'horizontal-labels'}}>` wrapper is
	 * the `direction` prop here — set during this component's init, so `Field`
	 * reads it as it would from a real `FormLayout`.
	 */
	interface Props extends Omit<FieldProps, 'children'> {
		/** `id` of the nested control, matching the field's `inputID`. */
		controlID?: string;
		/** `data-testid` on the nested control. */
		controlTestID?: string;
		/** `aria-describedby` on the nested control, where upstream sets one. */
		controlDescribedBy?: string;
		/**
		 * Renders a `role="radiogroup"` labelled by this id instead of an input,
		 * for the group-label case.
		 */
		groupLabelledBy?: string;
		/** Layout direction published to the field, as a `FormLayout` would. */
		direction?: FormLayoutDirection;
	}

	const {
		controlID,
		controlTestID,
		controlDescribedBy,
		groupLabelledBy,
		direction,
		...fieldProps
	}: Props = $props();

	// Context must be set during init, so this is a plain statement rather than
	// an effect; the getter keeps it live if `direction` ever changes.
	// svelte-ignore state_referenced_locally
	if (direction) {
		setFormLayoutContext(() => direction);
	}
</script>

<Field {...fieldProps}>
	{#if groupLabelledBy}
		<div role="radiogroup" aria-labelledby={groupLabelledBy}></div>
	{:else}
		<input id={controlID} data-testid={controlTestID} aria-describedby={controlDescribedBy} />
	{/if}
</Field>
