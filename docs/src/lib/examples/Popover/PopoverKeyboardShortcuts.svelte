<!--
	Ported from upstream's `templates/blocks/components/Popover/PopoverKeyboardShortcuts.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Divider, Heading, HStack, Popover, Text, VStack } from '@astryx-svelte/core';

	const shortcuts = [
		{ key: '⌘K', action: 'Command palette' },
		{ key: '⌘/', action: 'Toggle sidebar' },
		{ key: '⌘.', action: 'Quick actions' }
	];
</script>

<Popover placement="below" label="Keyboard shortcuts" width={260}>
	{#snippet content()}
		<VStack gap={2}>
			<Heading level={4}>Keyboard shortcuts</Heading>
			<Divider />
			{#each shortcuts as s (s.key)}
				<HStack gap={3}>
					<Text type="body" weight="bold">{s.key}</Text>
					<Text type="body">{s.action}</Text>
				</HStack>
			{/each}
		</VStack>
	{/snippet}
	<Button label="Shortcuts">Shortcuts</Button>
</Popover>
