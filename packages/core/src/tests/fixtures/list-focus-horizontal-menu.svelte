<script lang="ts">
	import { useListFocus } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `HorizontalMenu` — a horizontal list (menubar-like) for the RTL
	 * direction tests. Upstream sets `dir` on the list container itself because
	 * jsdom reflects the attribute into computed style only on the element that
	 * carries it; that is also the element the hook reads through `listRef`, so
	 * the placement is the same here.
	 *
	 */
	const { dir }: { dir?: 'ltr' | 'rtl' } = $props();

	const list = useListFocus(() => ({ orientation: 'horizontal' }));

	const items = ['One', 'Two', 'Three'];
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div {@attach list.attachList} role="menu" {dir} onkeydown={list.handleKeyDown}>
	{#each items as label (label)}
		<div role="menuitem" tabindex={-1} data-testid={label}>{label}</div>
	{/each}
</div>
