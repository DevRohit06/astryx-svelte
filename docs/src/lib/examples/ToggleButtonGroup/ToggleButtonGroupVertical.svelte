<!--
	Ported from upstream's `templates/blocks/components/ToggleButtonGroup/ToggleButtonGroupVertical.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Text, ToggleButton, ToggleButtonGroup, VStack } from '@astryx-svelte/core';

	let view = $state<string | null>('grid');
	let filters = $state<string[]>(['active']);
</script>

<VStack gap={4}>
	<VStack gap={1}>
		<Text type="label" color="secondary">Single select</Text>
		<ToggleButtonGroup
			orientation="vertical"
			value={view}
			onChange={(next: string | null) => (view = next)}
			label="View mode"
		>
			<ToggleButton value="list" label="List" />
			<ToggleButton value="grid" label="Grid" />
			<ToggleButton value="board" label="Board" />
		</ToggleButtonGroup>
	</VStack>
	<VStack gap={1}>
		<Text type="label" color="secondary">Multi select</Text>
		<ToggleButtonGroup
			orientation="vertical"
			type="multiple"
			value={filters}
			onChange={(next) => (filters = next)}
			label="Status filters"
		>
			<ToggleButton value="active" label="Active" />
			<ToggleButton value="pending" label="Pending" />
			<ToggleButton value="closed" label="Closed" />
		</ToggleButtonGroup>
	</VStack>
</VStack>
