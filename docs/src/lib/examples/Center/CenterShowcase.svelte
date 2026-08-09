<!--
	Ported from upstream's `templates/blocks/components/Center/CenterShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Heading, Stack, Text } from '@astryx-svelte/core';
</script>

<Center axis="both" width="100%" height={240}>
	<Stack direction="vertical" gap={2} hAlign="center">
		<Heading level={4}>Centered content</Heading>
		<Text type="body" color="secondary">Horizontally and vertically aligned.</Text>
	</Stack>
</Center>
