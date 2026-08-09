<script lang="ts">
	import Field from '$lib/components/field/field.svelte';
	import FormLayout from '$lib/components/form-layout/form-layout.svelte';
	import type { FormLayoutDirection } from '$lib/components/form-layout/form-layout-context.svelte.js';

	/**
	 * A real `FormLayout` whose `direction` can change after mount, around a real
	 * `Field`.
	 *
	 * The context is deliberately *not* set by this fixture — `FormLayout`
	 * publishes it, so what the case observes is the whole provider → consumer
	 * chain rather than a hand-set context. `field-harness.svelte` cannot serve
	 * here: it calls `setFormLayoutContext` at init behind an `if (direction)`,
	 * so a field starting outside a layout would have no context to update.
	 */
	interface Props {
		direction: FormLayoutDirection;
	}

	const { direction }: Props = $props();
</script>

<FormLayout {direction}>
	<Field label="Display name" inputID="dn" data-testid="field">
		<input id="dn" />
	</Field>
</FormLayout>
