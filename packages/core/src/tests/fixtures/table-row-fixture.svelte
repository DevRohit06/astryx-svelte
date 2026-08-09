<script lang="ts">
	import TableRow from '$lib/components/table/table-row.svelte';

	/**
	 * A bare `<TableRow>` inside a hand-written `<table><tbody>`, as upstream's
	 * `TableRow` cases write it. `rest` carries the props under test, including
	 * the attachment key standing in for upstream's `ref`.
	 */
	interface Props {
		/** One `<td>` per entry. */
		cells?: string[];
		rest?: Record<string, unknown>;
	}

	const { cells = ['Cell'], rest = {} }: Props = $props();
</script>

<table>
	<tbody>
		<TableRow {...rest}>
			{#each cells as cell (cell)}
				<td>{cell}</td>
			{/each}
		</TableRow>
	</tbody>
</table>
