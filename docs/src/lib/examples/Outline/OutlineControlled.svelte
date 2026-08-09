<!--
	Ported from upstream's `templates/blocks/components/Outline/OutlineControlled.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, Outline, Text, VStack } from '@astryx-svelte/core';
	import type { OutlineItem } from '@astryx-svelte/core';

	const items: OutlineItem[] = [
		{ id: 'ctrl-summary', label: 'Summary', level: 2 },
		{ id: 'ctrl-details', label: 'Details', level: 2 },
		{ id: 'ctrl-results', label: 'Results', level: 2 },
		{ id: 'ctrl-next-steps', label: 'Next steps', level: 2 }
	];

	let activeId = $state('ctrl-details');

	const index = $derived(items.findIndex((item) => item.id === activeId));

	function goTo(next: number): void {
		const clamped = Math.max(0, Math.min(items.length - 1, next));
		activeId = items[clamped].id;
	}
</script>

<VStack gap={4} style="width: 240px">
	<Outline {items} {activeId} onActiveIdChange={(id) => (activeId = id)} />
	<HStack gap={2}>
		<Button variant="secondary" size="sm" label="Previous" onclick={() => goTo(index - 1)} />
		<Button variant="secondary" size="sm" label="Next" onclick={() => goTo(index + 1)} />
	</HStack>
	<Text type="supporting" color="secondary">
		Active section: {items[index]?.label}
	</Text>
</VStack>
