<script lang="ts">
	import { useLayoutSlots } from '$lib/components/layout/layout-slots-context.svelte.js';

	/** Reports the current `LayoutSlots` record as JSON. */
	const slots = useLayoutSlots();
</script>

<span data-testid="slots">{JSON.stringify(slots())}</span>
