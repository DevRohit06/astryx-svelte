<!--
	Ported from upstream's `templates/blocks/components/Icon/IconSizes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, Text, VStack } from '@astryx-svelte/core';
</script>

<HStack gap={4}>
	<VStack gap={1} hAlign="center">
		<Icon icon="search" size="xsm" />
		<Text type="supporting">xsm</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="search" size="sm" />
		<Text type="supporting">sm</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="search" size="md" />
		<Text type="supporting">md</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="search" size="lg" />
		<Text type="supporting">lg</Text>
	</VStack>
</HStack>
