<script lang="ts">
	import { useListFocus } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `NestedMenu`: a menu whose second item contains a *nested*
	 * `role="menu"` (mirrors an inline submenu flyout). Exercises
	 * `boundarySelector` — item scoping plus event ownership.
	 *
	 * The `probe-owns` input surfaces `ownsEvent` the way upstream's does: its
	 * own keydown handler writes the boolean onto a `data-owns` attribute, so the
	 * assertion reads the DOM rather than a React ref.
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
	<div role="menuitem" tabindex={-1} data-testid="Outer2">
		Outer2
		<!-- Nested submenu rendered inline (like a popover flyout). -->
		<div role="menu" data-testid="inner-menu">
			<div role="menuitem" tabindex={-1} data-testid="Inner1">Inner1</div>
			<div role="menuitem" tabindex={-1} data-testid="Inner2">Inner2</div>
		</div>
	</div>
	<div role="menuitem" tabindex={-1} data-testid="Outer3">Outer3</div>
	<!-- Surface ownership for assertions. -->
	<input data-testid="probe-owns" onkeydown={report} />
</div>
