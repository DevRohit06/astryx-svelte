<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarUserCard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarStatusDot, Stack, Text } from '@astryx-svelte/core';

	const USERS = [
		{
			name: 'Itai Jordaan',
			src: 'https://lookaside.facebook.com/assets/astryx/DATA-Itai-Jordaan.png',
			role: 'Engineering Lead',
			variant: 'success'
		},
		{
			name: 'Margot Schroder',
			src: 'https://lookaside.facebook.com/assets/astryx/DATA-Margot-Schroder.png',
			role: 'Product Designer',
			variant: 'neutral'
		},
		{
			name: 'Daniela Gimenez',
			src: 'https://lookaside.facebook.com/assets/astryx/DATA-Daniela-Gimenez.png',
			role: 'Engineering Manager',
			variant: 'error'
		}
	] as const;
</script>

<Stack direction="vertical" gap={4}>
	{#each USERS as user (user.name)}
		<Stack direction="horizontal" gap={3} vAlign="center">
			<Avatar src={user.src} name={user.name} size="lg">
				{#snippet status()}<AvatarStatusDot variant={user.variant} label={user.variant} />{/snippet}
			</Avatar>
			<Stack direction="vertical" gap={0}>
				<Text type="body" weight="bold">{user.name}</Text>
				<Text type="supporting" color="secondary">{user.role}</Text>
			</Stack>
		</Stack>
	{/each}
</Stack>
