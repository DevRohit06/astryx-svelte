<!--
	Ported from upstream's `templates/blocks/components/AvatarGroupOverflow/AvatarGroupOverflowCustomText.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@astryx-svelte/core';

	const TEAM = [{ name: 'Alex Daniels' }, { name: 'Ann Smith' }, { name: 'Carol Davis' }];
</script>

<Stack direction="vertical" gap={3}>
	<Text type="supporting" color="secondary">Team members</Text>
	<AvatarGroup size="lg">
		{#each TEAM as member (member.name)}
			<Avatar name={member.name} />
		{/each}
		<AvatarGroupOverflow count={12}>12+</AvatarGroupOverflow>
	</AvatarGroup>
</Stack>
