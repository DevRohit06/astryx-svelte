<script lang="ts">
	import { HStack, Text, VStack, useTranslator } from '$lib/index.js';

	// A consumer of the provider. `useTranslator` has to run in a *descendant* —
	// it reads context at init — which is exactly upstream's constraint too.
	const t = useTranslator();

	// Read at call time, so these re-resolve when the provider's locale changes.
	const rows = $derived([
		['@astryx.pagination.next', t('@astryx.pagination.next')],
		['@astryx.pagination.previous', t('@astryx.pagination.previous')],
		['@astryx.avatarGroup.label', t('@astryx.avatarGroup.label')],
		['@astryx.pagination.count', t('@astryx.pagination.count', { from: 1, to: 10, total: 1000 })]
	]);
</script>

<VStack gap={1}>
	{#each rows as [key, value] (key)}
		<HStack gap={3} vAlign="center">
			<Text type="label" size="sm"><code>{key}</code></Text>
			<Text>{value}</Text>
		</HStack>
	{/each}
</VStack>
