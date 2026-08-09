<script lang="ts">
	import { useListFocus } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `NestedMenuWithInnerProbe` — the variant with the `ownsEvent`
	 * probe placed INSIDE the nested menu, so a key event from it reports as
	 * not-owned by the outer list.
	 */
	const list = useListFocus(() => ({ boundarySelector: '[role="menu"]', wrap: false }));

	function report(event: KeyboardEvent): void {
		const target = event.currentTarget as HTMLElement;
		target.setAttribute('data-owns', String(list.ownsEvent(event)));
	}
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div {@attach list.attachList} role="menu" onkeydown={list.handleKeyDown}>
	<div role="menuitem" tabindex={-1} data-testid="Outer1">Outer1</div>
	<div role="menu" data-testid="inner-menu">
		<input data-testid="inner-probe" onkeydown={report} />
	</div>
</div>
