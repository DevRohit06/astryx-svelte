<script lang="ts">
	import { useFormLayout } from '$lib/components/form-layout/form-layout-context.svelte.js';

	/**
	 * Upstream's `OptionalityReader`: renders the context's `defaultOptionality`
	 * so a test can assert what a child actually sees.
	 *
	 * Its own component rather than a snippet in the harness, because context is
	 * read during a component's *init* — `getContext` inside a snippet's `{@const}`
	 * runs at render time and throws.
	 */
	const formLayout = useFormLayout();
</script>

<span data-testid="optionality">{formLayout().defaultOptionality ?? 'unset'}</span>
