<!--
	Ported from upstream's `templates/blocks/components/Timestamp/TimestampRelativeFormat.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Timestamp } from '@astryx-svelte/core';

	const now = Date.now() / 1000;
</script>

<Stack direction="vertical" gap={3}>
	<Text type="supporting" color="secondary">Relative timestamps (hover for full date)</Text>
	<Stack direction="vertical" gap={2}>
		<Timestamp value={now - 5} format="relative" color="primary" />
		<Timestamp value={now - 120} format="relative" color="primary" />
		<Timestamp value={now - 3600} format="relative" color="primary" />
		<Timestamp value={now - 86400} format="relative" color="primary" />
		<Timestamp value={now - 259200} format="relative" color="primary" />
		<Timestamp value={now - 90 * 86400} format="relative" color="primary" />
	</Stack>
</Stack>
