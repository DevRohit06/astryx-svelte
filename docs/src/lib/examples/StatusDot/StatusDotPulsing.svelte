<!--
	Ported from upstream's `templates/blocks/components/StatusDot/StatusDotPulsing.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, StatusDot } from '@astryx-svelte/core';
</script>

<HStack gap={2} vAlign="center">
	<StatusDot variant="success" label="Live" isPulsing />
	<StatusDot variant="warning" label="Processing" isPulsing />
	<StatusDot variant="error" label="Error" isPulsing />
	<StatusDot variant="accent" label="Processing" isPulsing />
	<StatusDot variant="neutral" label="Error" isPulsing />
</HStack>
