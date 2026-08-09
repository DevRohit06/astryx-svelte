<!--
	Ported from upstream's `templates/blocks/components/Selector/SelectorGhostToolbar.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, Selector } from '@astryx-svelte/core';

	let view = $state<string | undefined>('week');
	let density = $state<string | undefined>('comfortable');
</script>

<HStack align="center" gap={2}>
	<Button label="Today" variant="ghost" />
	<Selector
		label="Calendar view"
		isLabelHidden
		variant="ghost"
		options={[
			{ value: 'day', label: 'Day' },
			{ value: 'week', label: 'Week' },
			{ value: 'month', label: 'Month' }
		]}
		value={view}
		onChange={(next: string) => (view = next)}
	/>
	<Selector
		label="Density"
		isLabelHidden
		variant="ghost"
		options={[
			{ value: 'compact', label: 'Compact' },
			{ value: 'comfortable', label: 'Comfortable' },
			{ value: 'spacious', label: 'Spacious' }
		]}
		value={density}
		onChange={(next: string) => (density = next)}
		status={{ type: 'warning', message: 'This setting affects all users' }}
		statusVariant="tooltip"
	/>
	<Button label="Export" variant="ghost" />
</HStack>
