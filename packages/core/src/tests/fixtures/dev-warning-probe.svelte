<script lang="ts">
	import { useDevWarning } from '$lib/hooks/use-dev-warning.svelte.js';

	/**
	 * `renderHook`'s stand-in for a hook that returns nothing: the observable
	 * effect is the `console.warn` call, so the probe renders nothing and the
	 * test spies on the console. `condition` is a prop so `rerender` covers
	 * upstream's "warns after the condition flips" case.
	 */
	interface Props {
		condition: boolean;
		message?: string;
	}

	const { condition, message = 'boom' }: Props = $props();

	// `message` is a fixed string in the hook's signature, as it is upstream:
	// only `condition` varies, so only it comes in as a getter.
	// svelte-ignore state_referenced_locally
	useDevWarning('TestComponent', message, () => condition);
</script>
