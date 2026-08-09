<!--
	Ported from upstream's `templates/blocks/components/HStack/HStackShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, HStack, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={6} width="100%" style="max-width: 400px">
	<VStack gap={2}>
		<Text type="supporting" color="secondary">HAlign: start</Text>
		<HStack gap={2}>
			<Badge label="React" />
			<Badge label="TypeScript" />
			<Badge label="Node.js" />
		</HStack>
	</VStack>
	<VStack gap={2}>
		<Text type="supporting" color="secondary">HAlign: center</Text>
		<HStack gap={4} hAlign="center">
			<Badge label="Design" />
			<Badge label="Engineering" />
			<Badge label="Product" />
		</HStack>
	</VStack>
	<VStack gap={2}>
		<Text type="supporting" color="secondary">HAlign: between</Text>
		<HStack gap={2} hAlign="between">
			<Badge label="Start" />
			<Badge label="Middle" />
			<Badge label="End" />
		</HStack>
	</VStack>
</VStack>
