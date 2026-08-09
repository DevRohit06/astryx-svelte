<script lang="ts">
	import ResizeHandle from '$lib/components/resizable/resize-handle.svelte';
	import type { ResizeHandleProps } from '$lib/components/resizable/resize-handle.svelte';
	import {
		useResizable,
		type UseResizableSingleConfig
	} from '$lib/components/resizable/use-resizable.svelte.js';

	/**
	 * A handle wired to a real region, which is upstream's own `Harness`. The
	 * hook has to run during a component's init, so this is the equivalent of
	 * `renderHook` plus the component under test in one.
	 */
	interface Props {
		config?: UseResizableSingleConfig;
		handleProps?: Partial<ResizeHandleProps>;
	}

	const { config, handleProps = {} }: Props = $props();

	const region = useResizable(() => config ?? { defaultSize: 200, minSizePx: 100, maxSizePx: 400 });
</script>

<ResizeHandle resizable={region.props} label="Resize" {...handleProps} />
