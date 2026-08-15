<!--
	Ported from upstream's `templates/blocks/components/ToggleButton/ToggleButtonLabel.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Text, ToggleButton, ToggleButtonGroup } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Eye`/`EyeSlash`, `Funnel` and `MapPin`. The
	 * registry's `eyeSlash` and `funnel` are true matches; `Eye` and `MapPin` have
	 * no counterpart and substitute a built-in. Retires with the icon registry
	 * (port/todo.md).
	 */

	let isVisible = $state(true);
	let filters = $state<string[]>([]);
</script>

{#snippet funnelIcon()}<Icon icon="funnel" />{/snippet}
{#snippet mapPinIcon()}<Icon icon="info" />{/snippet}

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Standalone with label and icon</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<ToggleButton
				label="Visible"
				isPressed={isVisible}
				onPressedChange={(pressed) => (isVisible = pressed)}
			>
				{#snippet icon()}<Icon icon="info" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="eyeSlash" />{/snippet}
				{isVisible ? 'Visible' : 'Hidden'}
			</ToggleButton>
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Labeled group — filter toolbar</Text>
		<ToggleButtonGroup
			type="multiple"
			value={filters}
			onChange={(next) => (filters = next)}
			label="Filters"
		>
			<ToggleButton value="filter" label="Filter" icon={funnelIcon}>Filter</ToggleButton>
			<ToggleButton value="nearby" label="Nearby" icon={mapPinIcon}>Nearby</ToggleButton>
		</ToggleButtonGroup>
	</Stack>
</Stack>
