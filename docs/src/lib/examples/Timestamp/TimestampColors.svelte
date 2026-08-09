<!--
	Ported from upstream's `templates/blocks/components/Timestamp/TimestampColors.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Timestamp } from '@astryx-svelte/core';

	const DATE = '2026-02-19T17:00:00Z';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Primary</Text>
		<Timestamp value={DATE} format="date_time" color="primary" />
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Secondary</Text>
		<Timestamp value={DATE} format="date_time" color="secondary" />
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Disabled</Text>
		<Timestamp value={DATE} format="date_time" color="disabled" />
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Accent</Text>
		<Timestamp value={DATE} format="date_time" color="accent" />
	</Stack>
</Stack>
