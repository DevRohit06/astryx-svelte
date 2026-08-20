<!--
	Ported from upstream's `templates/blocks/components/BottomSheet/BottomSheetHeights.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		BottomSheet,
		Button,
		Divider,
		Heading,
		HStack,
		Text,
		VStack,
		type BottomSheetHeight
	} from '@astryx-svelte/core';

	const descriptions: Record<BottomSheetHeight, string> = {
		hug: 'Hug fits short, bounded content.',
		capped: 'Capped starts at a comfortable mid-height for lists and filters.',
		tall: 'Tall reserves most of the viewport for long or changing content.'
	};

	let height = $state<BottomSheetHeight | null>(null);
</script>

<HStack gap={2} wrap="wrap">
	<Button label="Open hug" onclick={() => (height = 'hug')} />
	<Button label="Open capped" onclick={() => (height = 'capped')} />
	<Button label="Open tall" onclick={() => (height = 'tall')} />
</HStack>
<BottomSheet
	isOpen={height != null}
	onOpenChange={(isOpen) => !isOpen && (height = null)}
	label={`${height ?? 'Hug'} height`}
	height={height ?? 'hug'}
>
	<VStack gap={4} style="padding: var(--spacing-4)">
		<Heading level={3}>{height ?? 'Hug'} height</Heading>
		<Divider />
		<Text type="body">{descriptions[height ?? 'hug']}</Text>
		<Button label="Close" onclick={() => (height = null)} />
	</VStack>
</BottomSheet>
