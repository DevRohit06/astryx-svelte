<script lang="ts">
	import TableBody from '$lib/components/table/table-body.svelte';
	import TableFooter from '$lib/components/table/table-footer.svelte';
	import TableHeader from '$lib/components/table/table-header.svelte';

	/**
	 * `<TableHeader>` / `<TableBody>` / `<TableFooter>` inside a hand-written
	 * `<table>`, for the rest-forwarding case.
	 */
	interface Props {
		head?: Record<string, unknown>;
		body?: Record<string, unknown>;
		foot?: Record<string, unknown>;
	}

	const { head = {}, body = {}, foot = {} }: Props = $props();
</script>

<table>
	<TableHeader {...head}>
		<tr>
			<th>H</th>
		</tr>
	</TableHeader>
	<TableBody {...body}>
		<tr>
			<td>B</td>
		</tr>
	</TableBody>
	<TableFooter {...foot}>
		<tr>
			<td>F</td>
		</tr>
	</TableFooter>
</table>
