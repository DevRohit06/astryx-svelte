<script lang="ts">
	import Theme from '$lib/theme/theme.svelte';
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';
	import type { ThemeMode } from '$lib/theme/types.js';
	import type { ToastOptions } from '$lib/components/toast/types.js';

	/**
	 * Upstream's `<Theme theme={testTheme} mode={…}><ShowToastButton /></Theme>`,
	 * plus the `hasViewport` variant its fourth case wraps in a real
	 * `<ToastViewport isTopLayer={false}>`.
	 *
	 * One fixture rather than two so `rerender` can flip `mode` on the same tree,
	 * which is what upstream's third case does with RTL's `rerender`.
	 */
	interface Props {
		theme: DefinedTheme;
		mode?: ThemeMode;
		options: ToastOptions;
		triggerLabel?: string;
		/** Render a real viewport, so `useToast` takes the context path. */
		hasViewport?: boolean;
	}

	const { theme, mode, options, triggerLabel = 'Trigger', hasViewport = false }: Props = $props();
</script>

{#snippet trigger()}
	<ShowToastButton {options} {triggerLabel} />
{/snippet}

<Theme {theme} {mode}>
	{#if hasViewport}
		<ToastViewport isTopLayer={false}>
			{@render trigger()}
		</ToastViewport>
	{:else}
		{@render trigger()}
	{/if}
</Theme>
