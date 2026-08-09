<!--
	Ported from upstream's `templates/blocks/components/Toolbar/ToolbarSizes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Heading, Icon, Stack, Toolbar } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Funnel` and `Plus`. The registry ships `funnel`
	 * — a direct swap — but has no plus, so *Add* substitutes a built-in. Retires
	 * with the icon registry (TODO.md).
	 */
	const SIZES = [
		{ size: 'sm', label: 'Small' },
		{ size: 'md', label: 'Medium' },
		{ size: 'lg', label: 'Large' }
	] as const;
</script>

<Stack direction="vertical" gap={4} style="width: 500px">
	{#each SIZES as entry (entry.size)}
		<Card>
			<Toolbar label={`${entry.label} toolbar`} size={entry.size}>
				{#snippet startContent()}
					<Heading level={4}>{entry.label}</Heading>
				{/snippet}
				{#snippet endContent()}
					<Button label="Filter" variant="ghost" isIconOnly>
						{#snippet icon()}<Icon icon="funnel" />{/snippet}
					</Button>
					<Button label="Add">
						{#snippet icon()}<Icon icon="check" />{/snippet}
					</Button>
				{/snippet}
			</Toolbar>
		</Card>
	{/each}
</Stack>
