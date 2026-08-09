<!--
	Ported from upstream's `templates/blocks/components/Outline/OutlineDensity.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Outline, Text, VStack } from '@astryx-svelte/core';
	import type { OutlineItem } from '@astryx-svelte/core';

	const items: OutlineItem[] = [
		{ id: 'density-getting-started', label: 'Getting started', level: 2 },
		{ id: 'density-configuration', label: 'Configuration', level: 2 },
		{ id: 'density-api', label: 'API reference', level: 3 },
		{ id: 'density-examples', label: 'Examples', level: 3 },
		{ id: 'density-faq', label: 'FAQ', level: 2 }
	];
</script>

<HStack gap={10} vAlign="start">
	<VStack gap={3} style="width: 200px">
		<Text type="supporting" color="secondary" weight="medium">Default</Text>
		<Outline {items} density="default" activeId="density-configuration" />
	</VStack>
	<VStack gap={3} style="width: 200px">
		<Text type="supporting" color="secondary" weight="medium">Compact</Text>
		<Outline {items} density="compact" activeId="density-configuration" />
	</VStack>
</HStack>
