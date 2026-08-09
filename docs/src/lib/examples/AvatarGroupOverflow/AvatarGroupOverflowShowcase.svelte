<!--
	Ported from upstream's `templates/blocks/components/AvatarGroupOverflow/AvatarGroupOverflowShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@astryx-svelte/core';

	const USERS = [{ name: 'Alex Daniels' }, { name: 'Ann Smith' }, { name: 'Carol Davis' }];
</script>

<Stack direction="vertical" gap={8}>
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">Default overflow</Text>
		<AvatarGroup size="lg">
			{#each USERS as user (user.name)}
				<Avatar name={user.name} />
			{/each}
			<AvatarGroupOverflow count={5} />
		</AvatarGroup>
	</Stack>
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">Custom count text</Text>
		<AvatarGroup size="lg">
			{#each USERS.slice(0, 2) as user (user.name)}
				<Avatar name={user.name} />
			{/each}
			<AvatarGroupOverflow count={12}>12+</AvatarGroupOverflow>
		</AvatarGroup>
	</Stack>
</Stack>
