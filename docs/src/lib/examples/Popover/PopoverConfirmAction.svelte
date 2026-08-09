<!--
	Ported from upstream's `templates/blocks/components/Popover/PopoverConfirmAction.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Heading, HStack, Popover, Text, VStack } from '@astryx-svelte/core';

	let isOpen = $state(false);
</script>

<Popover
	placement="below"
	label="Confirm deletion"
	width={300}
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
>
	{#snippet content()}
		<VStack gap={3}>
			<Heading level={4}>Delete project?</Heading>
			<Text type="body">
				This will permanently delete the project and all its data. This action cannot be undone.
			</Text>
			<HStack gap={2} hAlign="end">
				<Button label="Delete" variant="destructive" onclick={() => (isOpen = false)}>
					Delete
				</Button>
				<Button label="Cancel" variant="ghost" onclick={() => (isOpen = false)}>Cancel</Button>
			</HStack>
		</VStack>
	{/snippet}
	<Button label="Delete project" variant="destructive">Delete project</Button>
</Popover>
