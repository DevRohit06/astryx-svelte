<!--
	Ported from upstream's `templates/blocks/components/Timestamp/TimestampFormats.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Timestamp } from '@astryx-svelte/core';

	const DATE = '2026-02-19T17:00:00Z';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">User-facing formats</Text>
		<Stack direction="horizontal" gap={4} vAlign="center">
			<Timestamp value={DATE} format="date" color="primary" />
			<Timestamp value={DATE} format="date_time" color="primary" />
			<Timestamp value={DATE} format="time" color="primary" />
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">System formats (logs and dev tools)</Text>
		<Stack direction="horizontal" gap={4} vAlign="center">
			<Timestamp value={DATE} format="system_date" type="code" color="primary" />
			<Timestamp value={DATE} format="system_date_time" type="code" color="primary" />
			<Timestamp value={DATE} format="system_time" type="code" color="primary" />
		</Stack>
	</Stack>
</Stack>
