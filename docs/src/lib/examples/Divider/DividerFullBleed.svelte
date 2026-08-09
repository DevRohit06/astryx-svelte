<!--
	Ported from upstream's `templates/blocks/components/Divider/DividerFullBleed.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Divider, HStack, Section, Text, VStack } from '@astryx-svelte/core';
</script>

<Section variant="transparent" width="100%">
	<Card width={400}>
		<VStack gap={3}>
			<Text type="label">Order Summary</Text>
			<HStack hAlign="between">
				<Text type="body">3 items</Text>
				<Text type="body">$127.00</Text>
			</HStack>
			<Divider isFullBleed />
			<HStack hAlign="between">
				<Text type="body">Shipping</Text>
				<Text type="body">$7.99</Text>
			</HStack>
			<HStack hAlign="between">
				<Text type="body">Tax</Text>
				<Text type="body">$10.16</Text>
			</HStack>
			<Divider isFullBleed />
			<HStack hAlign="between">
				<Text type="label">Total</Text>
				<Text type="label">$145.15</Text>
			</HStack>
		</VStack>
	</Card>
</Section>
