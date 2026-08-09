<script lang="ts">
	import { useListFocus, type UseListFocusOptions } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `RovingToolbar`. It spreads arbitrary hook options over its own
	 * defaults, so the rest props do the same here — every roving-tabindex,
	 * orientation and RTL case renders this one fixture with a different `opts`.
	 */
	const {
		labels = ['A', 'B', 'C'],
		disabledLabels = [],
		...opts
	}: { labels?: string[]; disabledLabels?: string[] } & UseListFocusOptions = $props();

	const list = useListFocus(() => ({
		itemSelector: 'button, input, [tabindex]',
		hasRovingTabIndex: true,
		orientation: 'horizontal',
		...opts
	}));
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	{@attach list.attachList}
	role="toolbar"
	onkeydown={list.handleKeyDown}
	onfocusin={list.handleFocus}
>
	{#each labels as label (label)}
		<button type="button" disabled={disabledLabels.includes(label)} data-testid={label}>
			{label}
		</button>
	{/each}
</div>
