<!--
	Ported from upstream's `templates/blocks/components/AvatarStatusDot/AvatarStatusDotVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarStatusDot, HStack } from '@astryx-svelte/core';
</script>

{#snippet onlineDot()}<AvatarStatusDot variant="success" label="Online" />{/snippet}
{#snippet awayDot()}<AvatarStatusDot variant="neutral" label="Away" />{/snippet}
{#snippet dndDot()}<AvatarStatusDot variant="error" label="Do not disturb" />{/snippet}

<HStack gap={4} vAlign="center">
	<Avatar name="Ana Silva" size="xl" status={onlineDot} />
	<Avatar name="Ben Okafor" size="xl" status={awayDot} />
	<Avatar name="Cleo Marsh" size="xl" status={dndDot} />
</HStack>
