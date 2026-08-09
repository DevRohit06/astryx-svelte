<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setLayoutAreaContext, type LayoutArea } from './layout-area-context.svelte.js';

	/**
	 * Tags a slot's content with the area it was rendered into — upstream's local
	 * `AreaProvider` helper, which exists there because JSX needs a component to
	 * name a subtree and here because setting context does.
	 *
	 * It renders no element of its own, which is load-bearing: `LayoutContent`'s
	 * padding collapse is a `:has(> .astryx-layout-header…)` on the inner wrapper,
	 * so a slot has to stay a *direct* child of it.
	 */
	const { area, children }: { area: LayoutArea; children?: Snippet } = $props();

	setLayoutAreaContext(() => area);
</script>

{#if children}{@render children()}{/if}
