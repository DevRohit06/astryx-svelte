<!--
	Ported from upstream's `templates/blocks/components/VisuallyHidden/VisuallyHiddenLiveRegion.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, Text, VStack, VisuallyHidden } from '@astryx-svelte/core';

	const columns = ['Backlog', 'In progress', 'Done'] as const;

	let column = $state(0);
	const current = $derived(columns[column]);

	function move() {
		column = (column + 1) % columns.length;
	}
</script>

<VStack gap={4} hAlign="start">
	<Text type="supporting" color="secondary">
		Drag-and-drop and other visual-only changes are silent to screen readers. A live region narrates
		them.
	</Text>
	<HStack gap={3} vAlign="center">
		<Button label="Move task" variant="secondary" onclick={move} />
		<Text type="body">
			Task is in <Text as="span" weight="bold">{current}</Text>
		</Text>
	</HStack>
	<VisuallyHidden as="div" aria-live="polite">
		{`Task moved to ${current}`}
	</VisuallyHidden>
</VStack>
