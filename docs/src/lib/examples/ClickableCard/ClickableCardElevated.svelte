<!--
	Ported from upstream's `templates/blocks/components/Card/ClickableCardElevated.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ClickableCard, Stack, Text, Heading } from '@astryx-svelte/core';
</script>

<ClickableCard label="Open report" href="#" elevation="med" width={320}>
	<Stack direction="vertical" gap={2}>
		<Heading level={4}>Quarterly report</Heading>
		<Text type="body" color="secondary">
			A raised shadow signals the whole card is clickable, lifting it above the surrounding content.
		</Text>
	</Stack>
</ClickableCard>
