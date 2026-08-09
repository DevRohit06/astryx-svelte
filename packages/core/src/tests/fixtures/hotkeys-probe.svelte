<script lang="ts">
	import { useHotkeys, type Hotkey } from '$lib/hooks/use-hotkeys.svelte.js';

	/**
	 * `renderHook`'s stand-in for a hook that returns nothing: everything it does
	 * is a side effect on `window`, so the probe renders nothing and the test
	 * observes the listener. `hotkeys` is a prop so `rerender` covers upstream's
	 * two re-render cases.
	 */
	const { hotkeys }: { hotkeys: Hotkey[] } = $props();

	useHotkeys(() => hotkeys);
</script>
