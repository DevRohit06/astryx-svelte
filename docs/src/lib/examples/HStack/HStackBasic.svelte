<!--
	Ported from upstream's `templates/blocks/components/HStack/HStackBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, HStack } from '@astryx-svelte/core';
</script>

<HStack gap={2} vAlign="center">
	<Badge label="React" />
	<Badge label="TypeScript" />
	<Badge label="Node.js" />
</HStack>
