<script lang="ts">
	import {
		useLongPress,
		type UseLongPressHandlers,
		type UseLongPressOptions
	} from '$lib/hooks/use-long-press.svelte.js';

	/**
	 * `renderHook`'s stand-in for a hook that returns handlers rather than a
	 * value: the instance export is what the test reads, in place of
	 * `result.current`. The handlers are called directly, as upstream's test
	 * calls them, so the probe renders nothing.
	 */
	const { options }: { options: () => UseLongPressOptions } = $props();

	export const handlers: UseLongPressHandlers = useLongPress(() => options());
</script>
