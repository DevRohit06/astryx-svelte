<!--
	Ported from upstream's `templates/blocks/components/IconButton/IconButtonFloating.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { IconButton, Icon, Stack, Text } from '@astryx-svelte/core';

	/**
	 * `elevation` reaches `IconButton` by inheritance on both sides —
	 * `IconButtonProps extends Omit<ButtonProps, …>` and the omit list does not
	 * name it — so there is no IconButton-specific prop behind this block.
	 *
	 * Upstream passes Heroicons' `Plus`; the registry ships no such name, so this
	 * substitutes a built-in, retiring with the icon registry (port/todo.md).
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
		FABs are usually icon-only — raise one with `elevation="high"`
	</Text>
	<Stack direction="horizontal" gap={3} vAlign="center">
		{#each VARIANTS as entry (entry.variant)}
			<IconButton label={entry.label} variant={entry.variant} elevation="high">
				{#snippet icon()}<Icon icon="check" />{/snippet}
			</IconButton>
		{/each}
	</Stack>
</Stack>
