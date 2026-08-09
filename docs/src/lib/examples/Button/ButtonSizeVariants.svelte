<!--
	Ported from upstream's `templates/blocks/components/Button/ButtonSizeVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Stack, Text } from '@astryx-svelte/core';

	const SIZES = [
		{ size: 'sm', label: 'Small' },
		{ size: 'md', label: 'Medium' },
		{ size: 'lg', label: 'Large' }
	] as const;
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Primary</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			{#each SIZES as entry (entry.size)}
				<Button label={entry.label} variant="primary" size={entry.size} />
			{/each}
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Secondary</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			{#each SIZES as entry (entry.size)}
				<Button label={entry.label} variant="secondary" size={entry.size} />
			{/each}
		</Stack>
	</Stack>
</Stack>
