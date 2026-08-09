<script lang="ts">
	import { useMediaQuery } from '$lib/hooks/use-media-query.svelte.js';

	/**
	 * Stands in for `@testing-library/react`'s `renderHook`: the hook has to run
	 * inside a component's init, so the harness is a component that runs it and
	 * renders what it saw. `query` is a prop so `rerender` covers upstream's
	 * "re-subscribes when query changes" case.
	 */
	interface Props {
		query: string;
		serverDefault?: boolean;
	}

	const { query, serverDefault = false }: Props = $props();

	// `serverDefault` is a one-time initial value by design — it is upstream's
	// `getServerSnapshot`, read once and then superseded by the live match — so
	// capturing it rather than tracking it is the point.
	// svelte-ignore state_referenced_locally
	const mediaQuery = useMediaQuery(() => query, serverDefault);
</script>

<span data-testid="matches">{String(mediaQuery.matches)}</span>
