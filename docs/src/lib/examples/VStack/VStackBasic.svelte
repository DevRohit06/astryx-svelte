<!--
	Ported from upstream's `templates/blocks/components/VStack/VStackBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Heading, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={3}>
	<Heading level={5}>Weekly Report</Heading>
	<Text type="body" color="secondary">VStack arranges its children in a vertical column.</Text>
	<Text type="body" color="secondary">The gap prop controls the spacing between each item.</Text>
</VStack>
