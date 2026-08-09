<!--
	Ported from upstream's `templates/blocks/components/Stack/StackDirections.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports `HStack`/`VStack` from `@astryxdesign/core/Layout` and
	`Token` from `@astryxdesign/core/Token`; this port publishes no per-component
	subpaths, so all three come off the root barrel.
-->
<script lang="ts">
	import { HStack, Token, VStack } from '@astryx-svelte/core';
</script>

<HStack gap={10} hAlign="center">
	<HStack gap={2} vAlign="center">
		<Token label="Horizontal" />
		<Token label="Horizontal" />
		<Token label="Horizontal" />
	</HStack>
	<VStack gap={2}>
		<Token label="Vertical" />
		<Token label="Vertical" />
		<Token label="Vertical" />
	</VStack>
</HStack>
