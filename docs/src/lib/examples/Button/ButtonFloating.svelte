<!--
	Ported from upstream's `templates/blocks/components/Button/ButtonFloating.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Icon, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Plus`; the registry ships no such name, so this
	 * substitutes a built-in — the same substitution `ButtonWithIcon` makes,
	 * retiring with the icon registry (TODO.md).
	 */
	const VARIANTS = [
		{ variant: 'primary', label: 'Primary' },
		{ variant: 'secondary', label: 'Secondary' },
		{ variant: 'ghost', label: 'Ghost' },
		{ variant: 'destructive', label: 'Destructive' }
	] as const;
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">
		Floating action buttons — raised above content with `elevation="med"`
	</Text>
	<Stack direction="horizontal" gap={3} vAlign="center">
		{#each VARIANTS as entry (entry.variant)}
			<Button label={entry.label} variant={entry.variant} elevation="med">
				{#snippet icon()}<Icon icon="check" />{/snippet}
			</Button>
		{/each}
	</Stack>
</Stack>
