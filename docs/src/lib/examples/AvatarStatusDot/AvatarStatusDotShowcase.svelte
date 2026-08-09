<!--
	Ported from upstream's `templates/blocks/components/AvatarStatusDot/AvatarStatusDotShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarStatusDot, HStack } from '@astryx-svelte/core';
</script>

<HStack gap={4} vAlign="center">
	<Avatar name="Online User" size="xl">
		{#snippet status()}<AvatarStatusDot variant="success" label="Online" />{/snippet}
	</Avatar>
	<Avatar name="Away User" size="xl">
		{#snippet status()}<AvatarStatusDot variant="neutral" label="Away" />{/snippet}
	</Avatar>
	<Avatar name="Busy User" size="xl">
		{#snippet status()}<AvatarStatusDot variant="error" label="Busy" />{/snippet}
	</Avatar>
</HStack>
