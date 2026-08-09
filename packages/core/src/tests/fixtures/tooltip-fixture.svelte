<script lang="ts">
	import Tooltip from '$lib/components/tooltip/tooltip.svelte';
	import type { ComponentProps } from 'svelte';

	/**
	 * Upstream's test tree — `<Tooltip content="…"><button>Trigger</button></Tooltip>` —
	 * as a fixture, because `children` is a snippet here and cannot be written
	 * inline in a `render()` props object.
	 */
	const props: Omit<ComponentProps<typeof Tooltip>, 'children'> = $props();
</script>

<Tooltip {...props}>
	<button type="button">Trigger</button>
</Tooltip>
