<script lang="ts">
	import { useFocusTrap } from '$lib/hooks/use-focus-trap.svelte.js';

	/** Upstream's `NestedInnerTrap` — the DOM-nested child of `NestedTraps`. */
	const { onEscape }: { onEscape: () => void } = $props();

	const trap = useFocusTrap(() => ({ isActive: true, onEscape }));
</script>

<div {@attach trap.attachContainer} data-testid="nested-inner">
	<button type="button">inner-btn</button>
</div>
