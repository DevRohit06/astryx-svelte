<!--
	Ported from upstream's `templates/blocks/components/Divider/DividerVertical.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Divider, HStack, Section, StackItem, Text, VStack } from '@astryx-svelte/core';

	/** Upstream's `dividerFill` `CSSProperties` object, as a style string. */
	const dividerFill = 'align-self: stretch; height: auto';
</script>

<Section variant="transparent" width="100%">
	<Card>
		<HStack gap={4} align="stretch">
			<StackItem size="fill">
				<VStack gap={1}>
					<Text type="label">Revenue</Text>
					<Text type="label">$24,500</Text>
					<Text type="supporting" color="secondary">+12% vs last month</Text>
				</VStack>
			</StackItem>
			<Divider orientation="vertical" style={dividerFill} />
			<StackItem size="fill">
				<VStack gap={1}>
					<Text type="label">Users</Text>
					<Text type="label">1,240</Text>
					<Text type="supporting" color="secondary">+8% vs last month</Text>
				</VStack>
			</StackItem>
			<Divider orientation="vertical" style={dividerFill} />
			<StackItem size="fill">
				<VStack gap={1}>
					<Text type="label">Conversion</Text>
					<Text type="label">3.2%</Text>
					<Text type="supporting" color="secondary">-0.5% vs last month</Text>
				</VStack>
			</StackItem>
		</HStack>
	</Card>
</Section>
