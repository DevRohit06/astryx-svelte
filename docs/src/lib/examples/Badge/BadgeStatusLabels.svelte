<!--
	Ported from upstream's `templates/blocks/components/Badge/BadgeStatusLabels.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={6}>
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">System status</Text>
		<Stack direction="horizontal" gap={2} vAlign="center">
			<Badge variant="success" label="Active" />
			<Badge variant="warning" label="Pending" />
			<Badge variant="error" label="Failed" />
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">Workflow</Text>
		<Stack direction="horizontal" gap={2} vAlign="center">
			<Badge variant="neutral" label="Draft" />
			<Badge variant="info" label="In Review" />
		</Stack>
	</Stack>
</Stack>
