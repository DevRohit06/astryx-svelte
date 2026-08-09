<!--
	Ported from upstream's `templates/blocks/components/Popover/PopoverShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Divider, Heading, Popover, Text, VStack } from '@astryx-svelte/core';

	let isOpen = $state(false);
</script>

<Popover
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
	hasAutoFocus={false}
	placement="below"
	label="Settings"
	width={280}
>
	{#snippet content()}
		<VStack gap={3}>
			<Heading level={4} tabindex={0}>Settings</Heading>
			<Divider />
			<Text type="body">Notifications, dark mode, and sound preferences.</Text>
		</VStack>
	{/snippet}
	<Button label="Settings">Settings</Button>
</Popover>
