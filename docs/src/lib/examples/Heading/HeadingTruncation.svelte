<!--
	Ported from upstream's `templates/blocks/components/Heading/HeadingTruncation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Heading } from '@astryx-svelte/core';
</script>

<div style="display: flex; flex-direction: column; gap: 24px">
	<div style="width: 300px; border: 1px solid #ccc; padding: 12px">
		<Heading level={2} maxLines={1}>
			Very Long Heading That Will Be Truncated To One Line With Ellipsis
		</Heading>
	</div>
	<div style="width: 300px; border: 1px solid #ccc; padding: 12px">
		<Heading level={2} maxLines={2}>
			Very Long Heading That Will Be Truncated To Two Lines To Keep Card Layout Compact
		</Heading>
	</div>
</div>
