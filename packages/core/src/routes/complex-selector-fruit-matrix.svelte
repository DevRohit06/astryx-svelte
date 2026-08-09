<script lang="ts" module>
	export type Fruit = 'Apple' | 'Pear' | 'Peach' | 'Plum';
	export type Ripeness = 'Crisp' | 'Tender' | 'Juicy' | 'Peak';

	export interface FruitValue {
		fruit: Fruit;
		ripeness: Ripeness;
	}

	export function formatFruitValue(value: FruitValue): string {
		return `${value.fruit} · ${value.ripeness}`;
	}

	const fruits: Array<{ id: Fruit; emoji: string; description: string }> = [
		{ id: 'Apple', emoji: '🍎', description: 'Bright and balanced' },
		{ id: 'Pear', emoji: '🍐', description: 'Soft floral sweetness' },
		{ id: 'Peach', emoji: '🍑', description: 'Round summer flavor' },
		{ id: 'Plum', emoji: '🟣', description: 'Jammy and tart' }
	];

	const ripenessLevels: Array<{ id: Ripeness; shortLabel: string; description: string }> = [
		{ id: 'Crisp', shortLabel: 'C', description: 'Snappy bite' },
		{ id: 'Tender', shortLabel: 'T', description: 'Easy bite' },
		{ id: 'Juicy', shortLabel: 'J', description: 'Full juice' },
		{ id: 'Peak', shortLabel: 'P', description: 'Most intense' }
	];

	const GRID_CELL_SELECTOR = '[role="gridcell"]';
</script>

<script lang="ts">
	import { useGridFocus } from '$lib/index.js';

	/**
	 * Upstream's `FruitRipenessMatrix`, the custom content of
	 * `ComplexSelector.stories.tsx`'s `FruitRipenessGrid` story.
	 *
	 * It is a component here for the same reason it is one upstream: it runs
	 * hooks over the *selected* value, which arrives as a parameter of
	 * `ComplexSelector`'s content snippet and so is not readable at the demo
	 * file's top level.
	 *
	 * Two translations:
	 *
	 * - **`gridRef` → `{@attach grid.attachGrid}`**, and the options come in as a
	 *   getter — the settled shape for every published hook in this port.
	 * - **`useEffect` → `$effect`**, with the `requestAnimationFrame` handle
	 *   cancelled on teardown. Upstream leaves its frame uncancelled; a Svelte
	 *   effect re-runs on every `value` write, so an outstanding frame would race
	 *   the next one.
	 */
	interface Props {
		value: FruitValue;
		onChange: (value: FruitValue) => void;
	}

	const { value, onChange }: Props = $props();

	// Upstream parameterises the hook on the container element type
	// (`useGridFocus<HTMLDivElement>`) because its return carries a
	// `RefObject<T>`; the port's returns an `Attachment<HTMLElement>` instead, so
	// there is no type parameter to pass.
	const grid = useGridFocus(() => ({
		columns: ripenessLevels.length,
		cellSelector: GRID_CELL_SELECTOR,
		hasRovingTabIndex: true
	}));

	$effect(() => {
		const rowIndex = fruits.findIndex((fruit) => fruit.id === value.fruit);
		const columnIndex = ripenessLevels.findIndex((level) => level.id === value.ripeness);
		const frame = requestAnimationFrame(() => {
			grid.focusCell(
				rowIndex >= 0 && columnIndex >= 0 ? rowIndex * ripenessLevels.length + columnIndex : 0
			);
		});
		return () => cancelAnimationFrame(frame);
	});
</script>

<!--
	`role="grid"` on a plain div, with the keydown/focusin handlers the hook
	returns. The container is not itself a tab stop: the roving stop lives on the
	cells, which is what `hasRovingTabIndex` manages, and upstream's grid carries
	no tabindex either — the same standing `Calendar`'s `MonthGrid` records.
-->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	{@attach grid.attachGrid}
	role="grid"
	aria-label="Fruit ripeness choices"
	onkeydown={grid.handleKeyDown}
	onfocusin={grid.handleFocus}
	class="thinking-surface"
>
	{#each fruits as fruit (fruit.id)}
		<div role="row" class="thinking-row">
			<div role="rowheader" class="fruit-summary">
				<span aria-hidden="true" class="fruit-emoji">{fruit.emoji}</span>
				<span class="fruit-text">
					<span class="fruit-name">{fruit.id}</span>
					<span class="fruit-description">{fruit.description}</span>
				</span>
			</div>
			{#each ripenessLevels as level (level.id)}
				{@const isSelected = value.fruit === fruit.id && value.ripeness === level.id}
				<button
					type="button"
					role="gridcell"
					aria-label={`${fruit.id}, ${level.id}: ${level.description}`}
					aria-selected={isSelected || undefined}
					tabindex={isSelected ? 0 : -1}
					onclick={() => onChange({ fruit: fruit.id, ripeness: level.id })}
					class="level-button"
					class:selected={isSelected}
				>
					{level.shortLabel}
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	/* Upstream authors these in `stylex.create`. StyleX may not be imported from a
	   `.svelte` file, so they are plain rules over the same theme tokens. */
	.thinking-surface {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}

	.thinking-row {
		display: grid;
		grid-template-columns: minmax(156px, 1fr) repeat(4, 56px);
		align-items: center;
		column-gap: var(--spacing-1);
		min-height: 48px;
		padding-block: var(--spacing-1);
		padding-inline: var(--spacing-2);
		border-radius: var(--radius-container);
		background-color: transparent;
	}

	@media (hover: hover) {
		.thinking-row:hover {
			background-color: var(--color-background-muted);
		}
	}

	.thinking-row:focus-within {
		background-color: var(--color-background-muted);
	}

	.fruit-summary {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.fruit-emoji {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-full);
		background-color: var(--color-background-muted);
		font-size: 17px;
		flex-shrink: 0;
	}

	.fruit-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.fruit-name {
		color: var(--color-text-primary);
		font-size: var(--text-label-size);
		font-weight: var(--font-weight-semibold);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.fruit-description {
		color: var(--color-text-secondary);
		font-size: var(--text-supporting-size);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.level-button {
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-full);
		background-color: var(--color-background-card);
		color: var(--color-text-secondary);
		min-height: 30px;
		padding-inline: var(--spacing-2);
		font-family: inherit;
		font-size: var(--text-supporting-size);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		opacity: 0.68;
		transition-property: opacity, background-color, border-color, color, box-shadow;
		transition-duration: var(--duration-fast);
		transition-timing-function: var(--ease-standard);
		outline: none;
		outline-offset: 2px;
	}

	.level-button:focus-visible {
		outline: 2px solid var(--color-accent);
	}

	@media (hover: hover) {
		.level-button:hover {
			opacity: 1;
			border-color: var(--color-border-emphasized);
			color: var(--color-text-primary);
		}
	}

	.level-button.selected {
		opacity: 1;
		border-color: var(--color-accent);
		background-color: var(--color-accent);
		color: var(--color-on-accent);
		box-shadow: var(--shadow-low);
	}
</style>
