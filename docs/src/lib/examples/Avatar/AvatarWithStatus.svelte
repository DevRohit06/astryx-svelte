<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarWithStatus.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarStatusDot, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="horizontal" gap={4} vAlign="center">
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Itai-Jordaan.png"
		name="Itai Jordaan"
		size="xl"
	>
		{#snippet status()}<AvatarStatusDot variant="success" label="Online" />{/snippet}
	</Avatar>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Margot-Schroder.png"
		name="Margot Schroder"
		size="xl"
	>
		{#snippet status()}<AvatarStatusDot variant="neutral" label="Offline" />{/snippet}
	</Avatar>
	<Avatar
		src="https://lookaside.facebook.com/assets/astryx/DATA-Pablo-Morales.png"
		name="Pablo Morales"
		size="xl"
	>
		{#snippet status()}<AvatarStatusDot variant="error" label="Busy" />{/snippet}
	</Avatar>
</Stack>
