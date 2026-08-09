<script lang="ts">
	import { useGridFocus, type UseGridFocusOptions } from '$lib/hooks/use-grid-focus.svelte.js';

	/**
	 * Upstream's `Grid`: a 3x3 grid shaped like Calendar, where each
	 * `role="gridcell"` div wraps the `<button>` that is the real focus target.
	 * `seed` marks which button starts tabbable, mirroring Calendar seeding the
	 * selected/today/first-enabled day; `seed = -1` seeds nothing.
	 */
	const {
		disabled = [],
		seed = 0,
		dir,
		...opts
	}: {
		disabled?: number[];
		seed?: number;
		dir?: 'ltr' | 'rtl';
	} & Partial<UseGridFocusOptions> = $props();

	const grid = useGridFocus(() => ({
		columns: 3,
		cellSelector: '[role="gridcell"]',
		isCellFocusable: (cell: HTMLElement) => cell.querySelector('button:not([disabled])') !== null,
		getFocusTarget: (cell: HTMLElement) => cell.querySelector<HTMLElement>('button'),
		hasRovingTabIndex: true,
		...opts
	}));

	const cells = Array.from({ length: 9 }, (_, i) => i);
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	{@attach grid.attachGrid}
	role="grid"
	{dir}
	onkeydown={grid.handleKeyDown}
	onfocusin={grid.handleFocus}
>
	{#each cells as i (i)}
		<div role="gridcell">
			<button
				type="button"
				disabled={disabled.includes(i)}
				tabindex={i === seed ? 0 : -1}
				data-testid={`cell-${i}`}
			>
				{i}
			</button>
		</div>
	{/each}
</div>
