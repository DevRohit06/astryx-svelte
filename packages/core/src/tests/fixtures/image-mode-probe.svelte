<script lang="ts">
	import {
		useImageMode,
		type ImageModeState,
		type UseImageModeOptions
	} from '$lib/hooks/use-image-mode.svelte.js';

	/**
	 * `renderHook`'s stand-in: the instance export is what the test reads, in
	 * place of `result.current`. Nothing is rendered — every assertion upstream
	 * makes is about the returned value.
	 */
	interface Props {
		src: string | null | undefined;
		options?: UseImageModeOptions;
	}

	const { src, options = {} }: Props = $props();

	export const imageMode: ImageModeState = useImageMode(
		() => src,
		() => options
	);
</script>
