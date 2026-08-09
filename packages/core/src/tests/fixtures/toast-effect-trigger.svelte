<script lang="ts">
	import { useToast } from '$lib/components/toast/use-toast.svelte.js';
	import type { ToastOptions } from '$lib/components/toast/types.js';

	/**
	 * Dispatches a toast from a `$effect`, which is the consumer pattern
	 * `ToastViewport`'s `addToast` comment documents (upstream's
	 * `useEffect(() => { if (error) toast({body: error, type: 'error'}); }, [error])`).
	 *
	 * It exists for one case: the announcement must ride the imperative dispatch
	 * path, so one dispatch is one announcement no matter how the surrounding
	 * reactive graph churns. If the announce (or the read around it) subscribed the
	 * caller's effect to the viewport's toast list, this effect would re-run on its
	 * own write and announce repeatedly.
	 */
	const { options }: { options: ToastOptions } = $props();

	const toast = useToast();

	$effect(() => {
		toast(options);
	});
</script>

<span data-testid="effect-trigger"></span>
