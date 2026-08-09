<script lang="ts">
	import OverlayScrim from '$lib/components/overlay/overlay-scrim.svelte';
	import {
		useOverlay,
		type UseOverlayOptions,
		type UseOverlayResult
	} from '$lib/components/overlay/use-overlay.svelte.js';

	/**
	 * `renderHook`'s stand-in for `useOverlay`: the result is exposed as an
	 * instance export, which `render(...).component` hands back, and the container
	 * is rendered so the `attachContainer` half is exercised too.
	 *
	 * `renderScrim` is upstream's `renderOverlay(children)` case — a scrim mounted
	 * on demand with content the hook never saw.
	 */
	interface Props {
		options?: UseOverlayOptions;
		renderScrim?: boolean;
		scrimText?: string;
	}

	const { options = {}, renderScrim = false, scrimText = 'on demand' }: Props = $props();

	export const overlay: UseOverlayResult = useOverlay(() => options);
</script>

<div {@attach overlay.attachContainer} {...overlay.containerProps} data-testid="container">
	{#if renderScrim}
		<OverlayScrim {...overlay.scrimProps}>
			<span>{scrimText}</span>
		</OverlayScrim>
	{/if}
</div>
