<!--
	Ported from upstream's `templates/blocks/components/Popover/PopoverFilterPanel.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		CheckboxInput,
		Divider,
		Heading,
		HStack,
		Popover,
		VStack
	} from '@astryx-svelte/core';

	let isOpen = $state(false);
	let filters = $state({
		active: true,
		archived: false,
		drafts: true,
		shared: false
	});

	const toggle = (key: keyof typeof filters) => (filters = { ...filters, [key]: !filters[key] });
</script>

<Popover
	placement="below"
	label="Filter"
	width={240}
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
>
	{#snippet content()}
		<VStack gap={3}>
			<Heading level={4}>Filter by status</Heading>
			<Divider />
			<CheckboxInput label="Active" value={filters.active} onChange={() => toggle('active')} />
			<CheckboxInput
				label="Archived"
				value={filters.archived}
				onChange={() => toggle('archived')}
			/>
			<CheckboxInput label="Drafts" value={filters.drafts} onChange={() => toggle('drafts')} />
			<CheckboxInput
				label="Shared with me"
				value={filters.shared}
				onChange={() => toggle('shared')}
			/>
			<Divider />
			<HStack gap={2} hAlign="end">
				<Button label="Apply" variant="primary" onclick={() => (isOpen = false)}>Apply</Button>
				<Button
					label="Reset"
					variant="ghost"
					onclick={() =>
						(filters = {
							active: true,
							archived: false,
							drafts: true,
							shared: false
						})}
				>
					Reset
				</Button>
			</HStack>
		</VStack>
	{/snippet}
	<Button label="Filter">Filter</Button>
</Popover>
