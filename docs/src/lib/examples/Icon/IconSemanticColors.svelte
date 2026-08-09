<!--
	Ported from upstream's `templates/blocks/components/Icon/IconSemanticColors.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, Text, VStack } from '@astryx-svelte/core';
</script>

<HStack gap={4} wrap="wrap">
	<VStack gap={1} hAlign="center">
		<Icon icon="search" color="primary" />
		<Text type="supporting">primary</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="menu" color="secondary" />
		<Text type="supporting">secondary</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="info" color="tertiary" />
		<Text type="supporting">tertiary</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="clock" color="disabled" />
		<Text type="supporting">disabled</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="calendar" color="accent" />
		<Text type="supporting">accent</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="success" color="success" />
		<Text type="supporting">success</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="error" color="error" />
		<Text type="supporting">error</Text>
	</VStack>
	<VStack gap={1} hAlign="center">
		<Icon icon="warning" color="warning" />
		<Text type="supporting">warning</Text>
	</VStack>
</HStack>
