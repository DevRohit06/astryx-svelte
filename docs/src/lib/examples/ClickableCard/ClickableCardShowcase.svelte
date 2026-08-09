<!--
	Ported from upstream's `templates/blocks/components/Card/ClickableCardShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ClickableCard, Heading, Stack, Text } from '@astryx-svelte/core';
</script>

<ClickableCard label="Settings" href="#" width={320}>
	<Stack direction="vertical" gap={2}>
		<Heading level={4}>Settings</Heading>
		<Text type="body" color="secondary">
			Click anywhere on this card to navigate. Nested buttons and links work independently.
		</Text>
	</Stack>
</ClickableCard>
