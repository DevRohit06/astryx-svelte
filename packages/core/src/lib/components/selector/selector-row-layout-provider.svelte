<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		setSelectorRowLayoutContext,
		type SelectorRowLayout
	} from './selector-row-layout-context.svelte.js';

	/**
	 * Imposes a row layout on the `SelectorOption`s rendered below it —
	 * upstream's `<SelectorRowLayoutContext value={rowLayout}>` wrapper, which
	 * exists here because setting context needs a component boundary where JSX
	 * only needs an element.
	 *
	 * It renders no DOM of its own, and it wraps only the trigger's value box:
	 * the options in the dropdown are outside it, so a height-pinned trigger
	 * never reaches into the popup and folds those rows too.
	 */
	const { layout, children }: { layout: SelectorRowLayout; children: Snippet } = $props();

	setSelectorRowLayoutContext(() => layout);
</script>

{@render children()}
