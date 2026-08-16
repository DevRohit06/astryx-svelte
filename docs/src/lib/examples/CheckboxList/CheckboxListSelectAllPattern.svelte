<!--
	Ported from upstream's `templates/blocks/components/CheckboxList/CheckboxListSelectAllPattern.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxList, CheckboxListItem, Divider } from '@astryx-svelte/core';

	const DOCUMENTS = [
		{ id: 'transactions', label: 'Transaction history' },
		{ id: 'statements', label: 'Account statements' },
		{ id: 'tax', label: 'Tax documents' },
		{ id: 'invoices', label: 'Invoices' }
	];

	const ALL_IDS = DOCUMENTS.map((d) => d.id);

	let selected = $state<string[]>(['transactions']);

	/**
	 * Upstream's `setSelected(prev => …)` has no counterpart here: a `$state`
	 * binding is assigned directly, the reduction port/todo.md records for every block
	 * that threads a functional setter.
	 */
	const allChecked = $derived(ALL_IDS.every((id) => selected.includes(id)));
	const noneChecked = $derived(selected.length === 0);
	const selectAllState = $derived(
		allChecked ? true : noneChecked ? false : ('indeterminate' as const)
	);
</script>

<CheckboxList label="Include in export">
	<CheckboxListItem
		label="Select all"
		isChecked={selectAllState}
		onCheck={(checked) => {
			selected = checked ? [...ALL_IDS] : [];
		}}
	/>
	<Divider />
	{#each DOCUMENTS as doc (doc.id)}
		<CheckboxListItem
			label={doc.label}
			isChecked={selected.includes(doc.id)}
			onCheck={(checked) => {
				selected = checked ? [...selected, doc.id] : selected.filter((v) => v !== doc.id);
			}}
		/>
	{/each}
</CheckboxList>
