<!--
	Ported from upstream's `templates/blocks/components/Spinner/SpinnerOnMedia.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Spinner } from '@astryx-svelte/core';
</script>

<HStack gap={4} vAlign="center">
	<Spinner shade="default" />
	<div style="background-color: #1a1a2e; padding: 16px; border-radius: 8px">
		<Spinner shade="onMedia" />
	</div>
</HStack>
