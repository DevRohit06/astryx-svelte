<!--
	Ported from upstream's `templates/blocks/components/Card/CardShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Heading, Stack, Text } from '@astryx-svelte/core';
</script>

<Card width={320}>
	<Stack direction="vertical" gap={2}>
		<Heading level={4}>Card title</Heading>
		<Text type="body" color="secondary">
			Cards group related content with a border and background. Use them for profiles, settings
			panels, or data summaries.
		</Text>
	</Stack>
</Card>
