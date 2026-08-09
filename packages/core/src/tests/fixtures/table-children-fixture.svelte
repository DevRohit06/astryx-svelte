<script lang="ts">
	import BaseTable from '$lib/components/table/base-table.svelte';
	import Table from '$lib/components/table/table.svelte';
	import TableCell from '$lib/components/table/table-cell.svelte';
	import TableRow from '$lib/components/table/table-row.svelte';

	/**
	 * Children ("streaming") mode. Upstream writes the rows as JSX children of
	 * `<Table>` / `<BaseTable>`; here they are a snippet, so the four shapes its
	 * cases use are selected by name.
	 */
	interface Props {
		/** Render the unstyled `BaseTable` instead of the styled `Table`. */
		base?: boolean;
		mode: 'bare-row' | 'bare-body' | 'body-with-row' | 'rows';
		rest?: Record<string, unknown>;
	}

	const { base = false, mode, rest = {} }: Props = $props();
</script>

{#snippet content()}
	{#if mode === 'bare-row'}
		<tr>
			<td>Manual cell</td>
		</tr>
	{:else if mode === 'bare-body'}
		<tbody>
			<tr>
				<td>Content</td>
			</tr>
		</tbody>
	{:else if mode === 'body-with-row'}
		<tbody>
			<TableRow>
				<TableCell>Cell</TableCell>
			</TableRow>
		</tbody>
	{:else}
		<TableRow>
			<TableCell>Streamed A</TableCell>
			<TableCell>Streamed B</TableCell>
		</TableRow>
		<TableRow>
			<TableCell>Streamed C</TableCell>
			<TableCell>Streamed D</TableCell>
		</TableRow>
	{/if}
{/snippet}

{#if base}
	<BaseTable {...rest} children={content} />
{:else}
	<Table {...rest} children={content} />
{/if}
