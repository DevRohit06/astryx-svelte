<!--
	Ported from upstream's `templates/blocks/components/StatusDot/StatusDotVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, StatusDot } from '@astryx-svelte/core';
</script>

<HStack gap={2} vAlign="center">
	<StatusDot variant="success" label="Positive" />
	<StatusDot variant="warning" label="Warning" />
	<StatusDot variant="error" label="Negative" />
	<StatusDot variant="accent" label="Info" />
	<StatusDot variant="neutral" label="Neutral" />
</HStack>
