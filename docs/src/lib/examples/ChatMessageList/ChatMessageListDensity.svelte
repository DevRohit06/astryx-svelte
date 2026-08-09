<!--
	Ported from upstream's `templates/blocks/components/ChatMessageList/ChatMessageListDensity.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The avatar differs per density, and a snippet with parameters cannot be
	pre-applied and handed to a prop, so the two sizes are declared separately and
	selected through a lookup — the same shape `ChatMessageMetadataStatus` uses.
	React's `<Fragment>` wrapper has no counterpart and needs none: `{#each}` is
	already a fragment.
-->
<script lang="ts">
	import type { ChatDensity } from '@astryx-svelte/core';
	import {
		Avatar,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		Divider,
		Text,
		VStack
	} from '@astryx-svelte/core';

	const DENSITIES: ChatDensity[] = ['compact', 'balanced', 'spacious'];
</script>

{#snippet smAvatar()}<Avatar name="Agent" size="sm" />{/snippet}
{#snippet mdAvatar()}<Avatar name="Agent" size="md" />{/snippet}

<VStack gap={4} style="max-width: 500px">
	{@const AVATAR_SIZE = {
		compact: smAvatar,
		balanced: mdAvatar,
		spacious: mdAvatar
	}}
	{#each DENSITIES as density, index (density)}
		{#if index > 0}
			<Divider />
		{/if}
		<VStack gap={2}>
			<Text type="supporting" color="secondary">
				{density.charAt(0).toUpperCase() + density.slice(1)}
			</Text>
			<VStack style="flex: 1; min-height: 0">
				<ChatMessageList {density}>
					<ChatMessage sender="user">
						<ChatMessageBubble>How does density work?</ChatMessageBubble>
					</ChatMessage>
					<ChatMessage sender="assistant" avatar={AVATAR_SIZE[density]}>
						<ChatMessageBubble>
							Density provides default spacing at every level — message gap, bubble padding, and gap
							between child elements. Use gap to tune row spacing independently.
						</ChatMessageBubble>
					</ChatMessage>
				</ChatMessageList>
			</VStack>
		</VStack>
	{/each}
</VStack>
