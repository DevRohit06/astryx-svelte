<!--
	Ported from upstream's `templates/blocks/components/Spinner/SpinnerSizes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Spinner } from '@astryx-svelte/core';
</script>

<HStack gap={4} vAlign="center">
	<Spinner size="sm" />
	<Spinner size="md" />
	<Spinner size="lg" />
	<Spinner size="xl" />
</HStack>
