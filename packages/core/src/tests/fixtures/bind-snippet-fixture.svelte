<script lang="ts" module>
	import { unwrapSlotArg } from '$lib/internal/bind-snippet.js';

	export interface GreetArg {
		name: string;
		count: number;
	}

	/** What the row-folding probe carries: per-column data plus the row itself. */
	export interface CellArg {
		label: string;
		item: { name: string };
	}

	/**
	 * Parameterised, module-exported snippets — the shape every table plugin uses
	 * for a slot that closes over per-cell data. Both read their parameter through
	 * `unwrapSlotArg` so one source works on both compile targets.
	 *
	 * `greet` is the `bindSnippet` case (nothing left open). `cell` is the
	 * `bindCellSnippet` case: the row is folded into the same single object, so
	 * the snippet still takes exactly one argument.
	 */
	export { greet, cell };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** A zero-parameter snippet the test built with `bindSnippet`. */
		bound?: Snippet;
		/** A one-parameter snippet the test built with `bindCellSnippet`. */
		boundCell?: Snippet<[{ name: string }]>;
		/** The row handed to `boundCell`, as `BaseTable` hands one to `renderCell`. */
		item?: { name: string };
	}

	let { bound, boundCell, item = { name: 'row' } }: Props = $props();
</script>

{#snippet greet(arg: GreetArg | (() => GreetArg))}
	{@const a = unwrapSlotArg(arg)}
	<span data-testid="greeting">{a.name}:{a.count}</span>
{/snippet}

{#snippet cell(arg: CellArg | (() => CellArg))}
	{@const a = unwrapSlotArg(arg)}
	<span data-testid="cell">{a.label}/{a.item.name}</span>
{/snippet}

<div data-testid="host">
	{#if bound}{@render bound()}{/if}
	{#if boundCell}{@render boundCell(item)}{/if}
</div>
