<script lang="ts">
	import { useListFocus } from '$lib/hooks/use-list-focus.svelte.js';

	/**
	 * Upstream's `Menu`: four `role="menuitem"` divs in a `role="menu"` container,
	 * with a subset marked `aria-disabled`. The hook is in its default mode — no
	 * roving tabindex — so the fixture owns the `tabindex` values, exactly as
	 * upstream's does.
	 */
	const { wrap = true, disabledLabels = [] }: { wrap?: boolean; disabledLabels?: string[] } =
		$props();

	const list = useListFocus(() => ({ wrap }));

	const items = ['One', 'Two', 'Three', 'Four'];
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div {@attach list.attachList} role="menu" onkeydown={list.handleKeyDown}>
	{#each items as label (label)}
		{@const disabled = disabledLabels.includes(label)}
		<div
			role="menuitem"
			tabindex={disabled ? undefined : -1}
			aria-disabled={disabled || undefined}
			data-testid={label}
		>
			{label}
		</div>
	{/each}
</div>
