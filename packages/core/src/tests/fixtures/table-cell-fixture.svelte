<script lang="ts">
	import TableCell from '$lib/components/table/table-cell.svelte';

	/**
	 * A bare `<TableCell>` inside a hand-written `<table><tbody><tr>`, as
	 * upstream's `TableCell` cases write it. `rest` carries the props under test,
	 * including the attachment key standing in for upstream's `ref`.
	 */
	interface Props {
		/** Plain text content. Ignored when `nested` or `empty` is set. */
		text?: string;
		/** Render `<span>Nested content</span>` instead of text. */
		nested?: boolean;
		/** Pass no children at all. */
		empty?: boolean;
		rest?: Record<string, unknown>;
	}

	const { text = 'Content', nested = false, empty = false, rest = {} }: Props = $props();
</script>

<table>
	<tbody>
		<tr>
			{#if empty}
				<TableCell {...rest} />
			{:else}
				<TableCell {...rest}>
					{#if nested}<span>Nested content</span>{:else}{text}{/if}
				</TableCell>
			{/if}
		</tr>
	</tbody>
</table>
