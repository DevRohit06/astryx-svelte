<!--
	Ported from upstream's `templates/blocks/components/Skeleton/SkeletonStaggeredList.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Skeleton, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={2}>
	<Skeleton width={300} height={16} index={0} />
	<Skeleton width={280} height={16} index={1} />
	<Skeleton width={320} height={16} index={2} />
	<Skeleton width={260} height={16} index={3} />
	<Skeleton width={290} height={16} index={4} />
</VStack>
