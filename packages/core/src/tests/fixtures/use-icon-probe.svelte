<script lang="ts">
	import { useIcon } from '$lib/components/icon/use-icon.svelte.js';
	import type { IconName } from '$lib/components/icon/icon-registry.js';

	/**
	 * `renderHook`'s stand-in for `useIcon`: runs the hook where a context-reading
	 * hook must run — component init — and renders what it returned.
	 *
	 * A hook returning a `Snippet` has nothing to expose through an instance
	 * export that would be worth reading; the rendered output *is* the result, and
	 * rendering it is also what proves the snippet is callable rather than merely
	 * non-null.
	 */
	interface Props {
		name?: IconName;
		/** So a wrapper can put several probes on the page and tell them apart. */
		testid?: string;
	}

	const { name = 'check', testid = 'icon-0' }: Props = $props();

	const icon = useIcon(() => name);
</script>

<span data-testid={testid}
	>{#if icon.current}{@render icon.current()}{/if}</span
>
