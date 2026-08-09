<script lang="ts">
	import { useListFocus, type UseListFocusOptions } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `ToolbarWithInput`: a text field between two buttons, with the
	 * caret guard on by default so the tests can turn it off through `opts`.
	 */
	const opts: UseListFocusOptions = $props();

	const list = useListFocus(() => ({
		itemSelector: 'button, input, [tabindex]',
		hasRovingTabIndex: true,
		orientation: 'horizontal',
		hasCaretGuard: true,
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
	<button type="button" data-testid="before">Before</button>
	<input type="text" value="hello" data-testid="field" />
	<button type="button" data-testid="after">After</button>
</div>
