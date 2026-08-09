<!--
	Ported from upstream's `templates/blocks/components/Card/ClickableCardWithNestedButton.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, ClickableCard, Heading, Stack, Text } from '@astryx-svelte/core';
</script>

<ClickableCard label="Product" href="#" width={320}>
	<Stack direction="vertical" gap={3}>
		<Stack direction="vertical" gap={1}>
			<Heading level={4}>Wireless Headphones</Heading>
			<Text type="body" color="secondary">$79.99</Text>
		</Stack>
		<Button label="Add to cart" onclick={() => {}} variant="primary" />
	</Stack>
</ClickableCard>
