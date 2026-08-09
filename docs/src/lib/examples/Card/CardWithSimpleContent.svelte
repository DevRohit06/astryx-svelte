<!--
	Ported from upstream's `templates/blocks/components/Card/CardWithSimpleContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Heading, Stack, Text } from '@astryx-svelte/core';
</script>

<Card width={360}>
	<Stack direction="vertical" gap={2}>
		<Heading level={3}>Project Overview</Heading>
		<Text type="body" color="secondary">
			This project tracks the redesign of the onboarding flow. The goal is to reduce drop-off by 15%
			in Q2.
		</Text>
		<Text type="supporting" color="secondary">Last updated 2 hours ago</Text>
	</Stack>
</Card>
