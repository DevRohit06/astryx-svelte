<!--
	Ported from upstream's `templates/blocks/components/AspectRatio/AspectRatioWithSkeleton.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Center, Skeleton } from '@astryx-svelte/core';
</script>

<Center width={600}>
	<AspectRatio ratio={16 / 9}>
		<Skeleton width="100%" height="100%" />
	</AspectRatio>
</Center>
