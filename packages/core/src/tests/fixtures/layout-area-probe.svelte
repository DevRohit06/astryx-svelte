<script lang="ts">
	import { useLayoutArea } from '$lib/components/layout/layout-area-context.svelte.js';

	/** Reports which layout area it was rendered inside. */
	const { testid }: { testid: string } = $props();

	const area = useLayoutArea();
</script>

<span data-testid={testid}>{String(area())}</span>
