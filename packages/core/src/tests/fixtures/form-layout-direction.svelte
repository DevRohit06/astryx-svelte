<script lang="ts">
	import { useFormLayout } from '$lib/components/form-layout/form-layout-context.svelte.js';

	/**
	 * Upstream's `DirectionReader` — a child that reports the direction its
	 * enclosing `FormLayout` published, so the context can be asserted from the
	 * DOM rather than reached into.
	 */
	const direction = useFormLayout();
</script>

<span data-testid="direction">{direction()}</span>
