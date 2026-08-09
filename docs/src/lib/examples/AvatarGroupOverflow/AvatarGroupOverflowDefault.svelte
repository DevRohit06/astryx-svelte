<!--
	Ported from upstream's `templates/blocks/components/AvatarGroupOverflow/AvatarGroupOverflowDefault.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, AvatarGroup, AvatarGroupOverflow, Stack, Text } from '@astryx-svelte/core';

	const REVIEWERS = [{ name: 'Alex Daniels' }, { name: 'Ann Smith' }, { name: 'Carol Davis' }];
</script>

<Stack direction="vertical" gap={3}>
	<Text type="supporting" color="secondary">Reviewers</Text>
	<AvatarGroup size="lg">
		{#each REVIEWERS as reviewer (reviewer.name)}
			<Avatar name={reviewer.name} />
		{/each}
		<AvatarGroupOverflow count={2} />
	</AvatarGroup>
</Stack>
