<!--
	Ported from upstream's `templates/blocks/components/Spinner/SpinnerWithLabel.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Spinner, Text, VStack } from '@astryx-svelte/core';
</script>

{#snippet richLabel()}
	<VStack gap={0} hAlign="center">
		<Text type="body" weight="bold">Fetching data</Text>
		<Text type="supporting" color="secondary">This may take a moment</Text>
	</VStack>
{/snippet}

<HStack gap={8} vAlign="start">
	<Spinner size="lg" label="Loading..." />
	<Spinner size="lg" label={richLabel} aria-label="Fetching data" />
</HStack>
