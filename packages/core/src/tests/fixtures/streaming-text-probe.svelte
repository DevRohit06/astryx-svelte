<script lang="ts">
	import {
		useStreamingText,
		type StreamingTextSpeed,
		type StreamingTextState
	} from '$lib/hooks/use-streaming-text.svelte.js';

	/**
	 * `renderHook`'s stand-in for `useStreamingText`: the hook has to run inside a
	 * component's init, so the harness is a component that runs it and renders
	 * what it returned.
	 *
	 * The hook's return is a *live* object rather than a plain string, so the
	 * instance export is also what the test reads in place of `result.current` —
	 * every one of upstream's assertions is a synchronous read taken right after
	 * an `act()`, and a `$state` read returns the written value with no flush in
	 * between. The rendered `<output>` is the same value going through the DOM,
	 * so the probe still proves the reveal reaches the markup.
	 *
	 * `text` / `streaming` / `speed` are props so `rerender` covers upstream's
	 * four `rerender` cases.
	 */
	interface Props {
		text: string;
		streaming: boolean;
		speed?: StreamingTextSpeed;
	}

	const { text, streaming, speed }: Props = $props();

	export const result: StreamingTextState = useStreamingText(
		() => text,
		() => streaming,
		() => ({ speed })
	);
</script>

<output data-testid="streamed">{result.current}</output>
