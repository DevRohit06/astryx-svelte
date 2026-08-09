<!--
	Ported from upstream's `templates/blocks/components/VisuallyHidden/VisuallyHiddenStructuralHeading.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Card, HStack, Text, VStack, VisuallyHidden } from '@astryx-svelte/core';

	const items = [
		{ name: 'astryx-core', status: 'Passing', variant: 'success' },
		{ name: 'astryx-charts', status: 'Failing', variant: 'error' },
		{ name: 'astryx-cli', status: 'Passing', variant: 'success' }
	] as const;
</script>

<VStack gap={3} hAlign="start">
	<Text type="supporting" color="secondary">
		The layout makes this group obvious to sighted users. A hidden heading gives screen-reader users
		the same landmark to jump to.
	</Text>
	<!-- No visible heading is needed here, but AT users navigate by heading. -->
	<VisuallyHidden as="h2">Build status</VisuallyHidden>
	<VStack gap={2}>
		{#each items as { name, status, variant } (name)}
			<Card variant="muted" padding={3}>
				<HStack gap={3} vAlign="center">
					<Text type="body">{name}</Text>
					<Badge label={status} {variant} />
				</HStack>
			</Card>
		{/each}
	</VStack>
</VStack>
