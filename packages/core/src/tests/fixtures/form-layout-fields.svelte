<script lang="ts" module>
	export interface FormLayoutFieldSpec {
		label: string;
		inputID: string;
		/** `data-testid` on the `Field` root. */
		fieldTestID?: string;
		/** `data-testid` on the nested input. */
		inputTestID?: string;
	}
</script>

<script lang="ts">
	import Field from '$lib/components/field/field.svelte';
	import FormLayout from '$lib/components/form-layout/form-layout.svelte';

	/**
	 * A `horizontal-labels` `FormLayout` over real `Field` children — upstream's
	 * last two `FormLayout` cases, which are about what a `Field` does inside the
	 * grid rather than about the layout itself.
	 */
	interface Props {
		fields: FormLayoutFieldSpec[];
	}

	const { fields }: Props = $props();
</script>

<FormLayout direction="horizontal-labels" data-testid="layout">
	{#each fields as field (field.inputID)}
		<Field label={field.label} inputID={field.inputID} data-testid={field.fieldTestID}>
			<input id={field.inputID} data-testid={field.inputTestID} />
		</Field>
	{/each}
</FormLayout>
