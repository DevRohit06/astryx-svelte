<!--
	Ported from upstream's `templates/blocks/components/Button/ButtonVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Stack, Text } from '@astryx-svelte/core';

	const VARIANTS = [
		{ variant: 'primary', label: 'Primary' },
		{ variant: 'secondary', label: 'Secondary' },
		{ variant: 'ghost', label: 'Ghost' },
		{ variant: 'destructive', label: 'Destructive' }
	] as const;
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Default</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			{#each VARIANTS as entry (entry.variant)}
				<Button label={entry.label} variant={entry.variant} />
			{/each}
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Disabled</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			{#each VARIANTS as entry (entry.variant)}
				<Button label={entry.label} variant={entry.variant} isDisabled />
			{/each}
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Loading</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			{#each VARIANTS as entry (entry.variant)}
				<Button label={entry.label} variant={entry.variant} isLoading />
			{/each}
		</Stack>
	</Stack>
</Stack>
