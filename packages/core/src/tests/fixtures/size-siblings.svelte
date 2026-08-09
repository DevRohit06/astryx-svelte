<script lang="ts">
	import { setSizeContext, type ElementSize } from '$lib/internal/contexts.svelte.js';
	import SizeProbe from './size-probe.svelte';

	/**
	 * Two sibling consumers under one provider, one with an explicit size and one
	 * without — upstream's `sibling children resolve independently` case.
	 */
	const { value }: { value: ElementSize | null } = $props();

	setSizeContext(() => value);
</script>

<span data-testid="a"><SizeProbe testid="probe-a" /></span>
<span data-testid="b"><SizeProbe size="sm" testid="probe-b" /></span>
