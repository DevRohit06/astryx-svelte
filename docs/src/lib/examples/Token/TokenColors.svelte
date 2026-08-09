<!--
	Ported from upstream's `templates/blocks/components/Token/TokenColors.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Token } from '@astryx-svelte/core';

	const COLORS = [
		{ color: 'default', label: 'Default' },
		{ color: 'red', label: 'Red' },
		{ color: 'orange', label: 'Orange' },
		{ color: 'yellow', label: 'Yellow' },
		{ color: 'green', label: 'Green' },
		{ color: 'teal', label: 'Teal' },
		{ color: 'cyan', label: 'Cyan' },
		{ color: 'blue', label: 'Blue' },
		{ color: 'purple', label: 'Purple' },
		{ color: 'pink', label: 'Pink' },
		{ color: 'gray', label: 'Gray' }
	] as const;
</script>

<Stack direction="vertical" gap={10} width="100%" style="max-width: 400px">
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">Default</Text>
		<Stack direction="horizontal" gap={1} wrap="wrap">
			{#each COLORS as entry (entry.color)}
				<Token label={entry.label} color={entry.color} />
			{/each}
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">Disabled</Text>
		<Stack direction="horizontal" gap={1} wrap="wrap">
			{#each COLORS as entry (entry.color)}
				<Token label={entry.label} color={entry.color} isDisabled />
			{/each}
		</Stack>
	</Stack>
</Stack>
