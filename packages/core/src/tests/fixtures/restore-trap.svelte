<script lang="ts">
	import { useFocusTrap } from '$lib/hooks/use-focus-trap.svelte.js';

	const { isActive }: { isActive: boolean } = $props();

	const trap = useFocusTrap(() => ({ isActive }));
</script>

<div {@attach trap.attachContainer} data-testid="restore-trap">
	<button type="button" data-testid="inside">Inside trap</button>
</div>
