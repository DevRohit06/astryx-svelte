<!--
	Ported from upstream's `templates/blocks/components/AvatarGroup/AvatarGroup.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@astryx-svelte/core';

	const USERS = [
		{ name: 'Ami Pena', src: 'https://lookaside.facebook.com/assets/astryx/DATA-Ami-Pena.png' },
		{ name: 'Drew Young', src: 'https://lookaside.facebook.com/assets/astryx/DATA-Drew-Young.png' },
		{
			name: 'Gabriela Fernandez',
			src: 'https://lookaside.facebook.com/assets/astryx/DATA-Gabriela-Fernandez.png'
		},
		{ name: 'Jihoo Song', src: 'https://lookaside.facebook.com/assets/astryx/DATA-Jihoo-Song.png' },
		{ name: 'Nam Tran', src: 'https://lookaside.facebook.com/assets/astryx/DATA-Nam-Tran.png' }
	];
</script>

<Stack direction="vertical" gap={8}>
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">Team members</Text>
		<AvatarGroup size="lg">
			{#each USERS as user (user.name)}
				<Avatar src={user.src} name={user.name} />
			{/each}
			<AvatarGroupOverflow count={3} />
		</AvatarGroup>
	</Stack>
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">Larger group</Text>
		<AvatarGroup size="lg">
			{#each USERS.slice(0, 3) as user (user.name)}
				<Avatar src={user.src} name={user.name} />
			{/each}
			<AvatarGroupOverflow count={8} />
		</AvatarGroup>
	</Stack>
</Stack>
