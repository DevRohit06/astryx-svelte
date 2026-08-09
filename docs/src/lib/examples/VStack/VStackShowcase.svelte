<!--
	Ported from upstream's `templates/blocks/components/VStack/VStackShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, HStack, Text, VStack } from '@astryx-svelte/core';
</script>

<HStack gap={10} hAlign="center">
	<VStack gap={2}>
		<Text type="supporting" color="secondary">gap=2</Text>
		<VStack gap={2}>
			<Badge label="Step 1" />
			<Badge label="Step 2" />
			<Badge label="Step 3" />
		</VStack>
	</VStack>
	<VStack gap={2}>
		<Text type="supporting" color="secondary">gap=4</Text>
		<VStack gap={4}>
			<Badge label="Step 1" />
			<Badge label="Step 2" />
			<Badge label="Step 3" />
		</VStack>
	</VStack>
	<VStack gap={2}>
		<Text type="supporting" color="secondary">gap=6</Text>
		<VStack gap={6}>
			<Badge label="Step 1" />
			<Badge label="Step 2" />
			<Badge label="Step 3" />
		</VStack>
	</VStack>
</HStack>
