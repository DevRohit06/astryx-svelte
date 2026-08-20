<!--
	Ported from upstream's `templates/blocks/components/BottomSheet/BottomSheetNoScrim.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		BottomSheet,
		Button,
		Divider,
		Heading,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';

	let isOpen = $state(false);
	let backgroundClicks = $state(0);
</script>

<Section padding={4}>
	<VStack gap={3}>
		<Heading level={3}>Nearby places</Heading>
		<Text type="body">Background interactions: {backgroundClicks}</Text>
		<Button
			label="Interact with page"
			variant="secondary"
			onclick={() => (backgroundClicks += 1)}
		/>
		<Button label="Show place details" onclick={() => (isOpen = true)} />
	</VStack>
	<BottomSheet
		{isOpen}
		onOpenChange={(next) => (isOpen = next)}
		label="Place details"
		height="hug"
		hasScrim={false}
	>
		<VStack gap={4} style="padding: var(--spacing-4)">
			<Heading level={3}>Central Park</Heading>
			<Divider />
			<Text type="body">The page remains visible and interactive behind this sheet.</Text>
			<Button label="Close details" onclick={() => (isOpen = false)} />
		</VStack>
	</BottomSheet>
</Section>
