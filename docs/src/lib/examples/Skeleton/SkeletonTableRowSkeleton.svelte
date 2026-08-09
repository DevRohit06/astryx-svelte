<!--
	Ported from upstream's `templates/blocks/components/Skeleton/SkeletonTableRowSkeleton.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Skeleton, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={2}>
	{#each [0, 1, 2, 3] as rowIndex (rowIndex)}
		<HStack gap={4} vAlign="center">
			<Skeleton width={50} height={16} index={rowIndex * 4} />
			<Skeleton width={180} height={16} index={rowIndex * 4 + 1} />
			<Skeleton width={100} height={16} index={rowIndex * 4 + 2} />
			<Skeleton width={80} height={16} index={rowIndex * 4 + 3} />
		</HStack>
	{/each}
</VStack>
