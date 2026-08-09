<script lang="ts">
	import Theme from '$lib/theme/theme.svelte';
	import Probe from './use-icon-probe.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';

	/**
	 * Upstream's `wrapper` for a context-reading hook: the `useIcon` probe inside a
	 * `<Theme>`, optionally with a second `<Theme>` nested under it.
	 *
	 * `count` renders several probes under the *same* theme, for the observer
	 * lifecycle case — many context-path consumers must still create no
	 * `MutationObserver` between them, because none of them reads the root
	 * attribute at all.
	 */
	interface Props {
		theme: DefinedTheme;
		innerTheme?: DefinedTheme;
		/** How many probes to render directly under `theme`. @default 1 */
		count?: number;
	}

	const { theme, innerTheme, count = 1 }: Props = $props();
</script>

<Theme {theme}>
	{#each Array.from({ length: count }, (_, i) => i) as index (index)}
		<Probe testid="icon-{index}" />
	{/each}
	{#if innerTheme}
		<Theme theme={innerTheme}>
			<Probe testid="inner" />
		</Theme>
	{/if}
</Theme>
