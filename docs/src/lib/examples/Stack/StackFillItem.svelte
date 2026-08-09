<!--
	Ported from upstream's `templates/blocks/components/Stack/StackFillItem.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's per-component subpaths collapse to the root barrel, and
	`style={{maxWidth: 300}}` becomes a CSS string. React's `key={user.name}`
	becomes `{#each … as user (user.name)}` — the same keyed identity, spelled
	the way Svelte spells it.
-->
<script lang="ts">
	import { Avatar, Button, Stack, StackItem, Text } from '@astryx-svelte/core';

	const USERS = [
		{ name: 'Olivia Chen', role: 'Engineering Lead' },
		{ name: 'Marcus Rivera', role: 'Product Designer' },
		{ name: 'Aisha Patel', role: 'Marketing Manager' }
	];
</script>

<Stack direction="vertical" gap={3} width="100%" style="max-width: 300px">
	{#each USERS as user (user.name)}
		<Stack direction="horizontal" gap={3} vAlign="center">
			<StackItem size="static">
				<Avatar name={user.name} size="md" />
			</StackItem>
			<StackItem size="fill">
				<Stack direction="vertical" gap={0}>
					<Text type="body" weight="bold">{user.name}</Text>
					<Text type="supporting" color="secondary">{user.role}</Text>
				</Stack>
			</StackItem>
			<StackItem size="static">
				<Button label="View" variant="secondary" size="sm" />
			</StackItem>
		</Stack>
	{/each}
</Stack>
