<!--
	Ported from upstream's `templates/blocks/components/Badge/BadgeShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4} hAlign="center">
	<Stack direction="horizontal" gap={2}>
		<Badge label="Neutral" variant="neutral" />
		<Badge label="Info" variant="info" />
		<Badge label="Success" variant="success" />
		<Badge label="Warning" variant="warning" />
		<Badge label="Error" variant="error" />
	</Stack>
	<Stack direction="horizontal" gap={2}>
		<Badge label="Blue" variant="blue" />
		<Badge label="Purple" variant="purple" />
		<Badge label="Pink" variant="pink" />
		<Badge label="Teal" variant="teal" />
		<Badge label="Orange" variant="orange" />
	</Stack>
</Stack>
