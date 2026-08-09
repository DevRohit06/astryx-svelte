<!--
	Ported from upstream's `templates/blocks/components/Toolbar/ToolbarBulkActions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	This block was one of the eight blocked on the Table plugin hooks — it imports
	`useTableSelection`/`useTableSelectionState`, which is not something the
	per-component status for `Toolbar` would ever have hinted at. A block's
	blockers are its whole import list.

	Two substitutions, both approximations rather than true matches, and both
	retiring with the `@lucide/svelte` registry (Phase 3): upstream's Heroicons
	`TrashIcon` becomes the registry's `close`, and `ArchiveBoxIcon` becomes
	`stop`. `Button.icon` is a `Snippet` here where upstream's is an `IconType`,
	so each is rendered inside one.

	The hooks take a **getter**, as every published hook in this port does, and
	`setSelectedKeys` is a plain setter — upstream's
	`Dispatch<SetStateAction<Set<string>>>` has no counterpart because a `$state`
	read is never stale.
-->
<script lang="ts">
	import {
		Badge,
		Button,
		Icon,
		Stack,
		Table,
		Toolbar,
		useTableSelection,
		useTableSelectionState
	} from '@astryx-svelte/core';

	interface Member extends Record<string, unknown> {
		id: string;
		name: string;
		status: string;
		role: string;
	}

	const DATA: Member[] = [
		{ id: '1', name: 'Alex Johnson', status: 'Active', role: 'Admin' },
		{ id: '2', name: 'Sam Rivera', status: 'Active', role: 'Editor' },
		{ id: '3', name: 'Jordan Lee', status: 'Invited', role: 'Viewer' },
		{ id: '4', name: 'Taylor Kim', status: 'Active', role: 'Editor' },
		{ id: '5', name: 'Casey Park', status: 'Active', role: 'Viewer' }
	];

	let selectedKeys = $state(new Set(['1', '3', '5']));

	const { selectionConfig } = useTableSelectionState<Member>(() => ({
		data: DATA,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));

	const selection = useTableSelection<Member>(() => selectionConfig);
</script>

<Stack direction="vertical">
	{#if selectedKeys.size > 0}
		<Toolbar label="Bulk actions" size="sm" variant="muted" dividers={['bottom']}>
			{#snippet startContent()}
				<Badge label={`${selectedKeys.size} selected`} />
				<Button label="Delete" variant="ghost" isIconOnly>
					{#snippet icon()}<Icon icon="close" />{/snippet}
				</Button>
				<Button label="Archive" variant="ghost" isIconOnly>
					{#snippet icon()}<Icon icon="stop" />{/snippet}
				</Button>
			{/snippet}
			{#snippet endContent()}
				<Button label="Deselect all" variant="ghost" onclick={() => (selectedKeys = new Set())} />
			{/snippet}
		</Toolbar>
	{/if}
	<Table
		idKey="id"
		columns={[
			{ key: 'name', header: 'Name' },
			{ key: 'status', header: 'Status' },
			{ key: 'role', header: 'Role' }
		]}
		data={DATA}
		plugins={{ selection }}
	/>
</Stack>
