<!--
	Ported from upstream's `templates/blocks/components/Toolbar/ToolbarTableFilter.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons' `MagnifyingGlassIcon`; the registry ships
	`search`, which is a true match rather than a stand-in. `TextInput.startIcon`
	is a `Snippet` here where upstream's is an `IconType`, so the registry icon
	is rendered inside one.
-->
<script lang="ts">
	import { Icon, MoreMenu, Selector, Stack, Table, TextInput, Toolbar } from '@astryx-svelte/core';

	let search = $state('');
	let status = $state<string | null>(null);
	let priority = $state<string | null>(null);
</script>

{#snippet startIcon()}
	<Icon icon="search" size="sm" color="secondary" />
{/snippet}

<Stack direction="vertical" style="width:100%">
	<Toolbar label="Table filters" size="sm" dividers={['bottom']}>
		{#snippet startContent()}
			<TextInput
				label="Search"
				isLabelHidden
				placeholder="Search..."
				value={search}
				onChange={(next) => (search = next)}
				{startIcon}
			/>
			<Selector
				label="Status"
				isLabelHidden
				placeholder="Status"
				hasClear
				value={status}
				onChange={(next) => (status = next)}
				options={['Open', 'In progress', 'Done']}
			/>
			<Selector
				label="Priority"
				isLabelHidden
				placeholder="Priority"
				hasClear
				value={priority}
				onChange={(next) => (priority = next)}
				options={['High', 'Medium', 'Low']}
			/>
		{/snippet}
		{#snippet endContent()}
			<MoreMenu
				items={[{ label: 'Compact view' }, { label: 'Comfortable view' }, { label: 'Export CSV' }]}
			/>
		{/snippet}
	</Toolbar>
	<Table
		idKey="id"
		columns={[
			{ key: 'task', header: 'Task' },
			{ key: 'status', header: 'Status' },
			{ key: 'priority', header: 'Priority' }
		]}
		data={[
			{ id: '1', task: 'Fix login bug', status: 'Open', priority: 'High' },
			{
				id: '2',
				task: 'Update docs',
				status: 'In progress',
				priority: 'Medium'
			},
			{ id: '3', task: 'Add unit tests', status: 'Open', priority: 'Low' }
		]}
	/>
</Stack>
