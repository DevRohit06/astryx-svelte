<script lang="ts">
	import { useListFocus } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `ToolbarWithEditable`: a non-empty `contenteditable` composer
	 * between two buttons. The caret guard must never steal an arrow key from it,
	 * whichever direction the caret would travel.
	 */
	const list = useListFocus(() => ({
		itemSelector: 'button, input, [contenteditable], [tabindex]',
		hasRovingTabIndex: true,
		orientation: 'horizontal',
		hasCaretGuard: true
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
	<div contenteditable="true" data-testid="composer">hello world</div>
	<button type="button" data-testid="after">After</button>
</div>
