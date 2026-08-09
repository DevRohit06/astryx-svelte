<!--
	Ported from upstream's `templates/blocks/components/Skeleton/SkeletonCardSkeleton.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, HStack, Skeleton, VStack } from '@astryx-svelte/core';
</script>

<Card width={320}>
	<VStack gap={3}>
		<HStack gap={3} vAlign="center">
			<Skeleton width={40} height={40} radius="rounded" index={0} />
			<VStack gap={1}>
				<Skeleton width={120} height={14} index={1} />
				<Skeleton width={80} height={12} index={2} />
			</VStack>
		</HStack>
		<Skeleton width="100%" height={14} index={3} />
		<Skeleton width="90%" height={14} index={4} />
		<Skeleton width="75%" height={14} index={5} />
	</VStack>
</Card>
