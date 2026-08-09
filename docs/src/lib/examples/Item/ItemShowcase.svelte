<!--
	Ported from upstream's `templates/blocks/components/Item/ItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Badge, Icon, Item, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `User`/`Document`/`Bell`; the registry ships
	 * none of the three, so this substitutes built-ins — the same substitution the
	 * demo routes make, retiring with the icon registry (TODO.md).
	 */
</script>

<Stack gap={0}>
	<Item label="Alice Johnson" description="Engineering Lead" onclick={() => {}}>
		{#snippet startContent()}<Avatar name="Alice Johnson" size={40} />{/snippet}
		{#snippet endContent()}<Badge label="Admin" />{/snippet}
	</Item>
	<Item
		label="Build completed successfully"
		description="Pipeline #4521 — all 42 tests passed"
		descriptionLines={1}
		onclick={() => {}}
	>
		{#snippet startContent()}<Icon icon="info" size="sm" />{/snippet}
		{#snippet endContent()}<Text color="secondary">5h ago</Text>{/snippet}
	</Item>
	<Item label="design-spec.pdf" description="Modified 2 hours ago" isSelected onclick={() => {}}>
		{#snippet startContent()}<Icon icon="copy" size="sm" />{/snippet}
		{#snippet endContent()}<Text color="secondary">2.4 MB</Text>{/snippet}
	</Item>
	<Item label="Compact menu item" density="compact" onclick={() => {}}>
		{#snippet startContent()}<Icon icon="check" size="sm" />{/snippet}
	</Item>
</Stack>
