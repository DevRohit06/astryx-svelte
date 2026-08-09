<!--
	Ported from upstream's `templates/blocks/components/StackItem/StackItemFill.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, HStack, StackItem, Text } from '@astryx-svelte/core';
</script>

<HStack gap={3} vAlign="center" width="100%" style="max-width: 400px">
	<StackItem size="static">
		<Card padding={3}>
			<Text type="supporting" color="secondary">Static</Text>
		</Card>
	</StackItem>
	<StackItem size="fill">
		<Card padding={3}>
			<Text type="supporting" color="secondary">Fills remaining space</Text>
		</Card>
	</StackItem>
</HStack>
