<!--
	Ported from upstream's `templates/blocks/components/AvatarGroup/AvatarGroupShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@astryx-svelte/core';

	const USERS = [
		{ name: 'Alex Daniels', key: 'alex' },
		{ name: 'Ann Smith', key: 'ann' },
		{ name: 'Carol Davis', key: 'carol' },
		{ name: 'Gina Wilson', key: 'gina' },
		{ name: 'Eve Park', key: 'eve' }
	];
</script>

<Stack direction="vertical" gap={8}>
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">Team members</Text>
		<AvatarGroup size="lg">
			{#each USERS as user (user.key)}
				<Avatar name={user.name} />
			{/each}
		</AvatarGroup>
	</Stack>
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">With overflow</Text>
		<AvatarGroup size="lg">
			{#each USERS.slice(0, 3) as user (user.key)}
				<Avatar name={user.name} />
			{/each}
			<AvatarGroupOverflow count={USERS.length - 3} />
		</AvatarGroup>
	</Stack>
</Stack>
