<!--
	Ported from upstream's `templates/blocks/components/Icon/IconNonSemanticColors.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, Text, VStack } from '@astryx-svelte/core';

	const colors = [
		'blue',
		'red',
		'green',
		'gray',
		'cyan',
		'teal',
		'yellow',
		'orange',
		'pink',
		'purple'
	] as const;
</script>

<HStack gap={4} wrap="wrap">
	{#each colors as color (color)}
		<VStack gap={1} hAlign="center">
			<Icon icon="search" {color} />
			<Text type="supporting">{color}</Text>
		</VStack>
	{/each}
</HStack>
