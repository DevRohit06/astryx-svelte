<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarStatusDot, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="horizontal" gap={4} vAlign="center">
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Ana-Thomas.png"
		name="Ana Thomas"
		size="xl"
	>
		{#snippet status()}<AvatarStatusDot variant="success" label="Online" />{/snippet}
	</Avatar>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Drew-Young.png"
		name="Drew Young"
		size="xl"
	/>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Jihoo-Song.png"
		name="Jihoo Song"
		size="xl"
	/>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Nam-Tran.png"
		name="Nam Tran"
		size="xl"
	>
		{#snippet status()}<AvatarStatusDot variant="error" label="Online" />{/snippet}
	</Avatar>
</Stack>
