<!--
	Ported from upstream's `templates/blocks/components/ChatMessageBubble/ChatMessageBubbleDensity.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's `.map()` over `DENSITIES` becomes an `{#each}` keyed by density —
	`key={density}` is what it uses on the React side.
-->
<script lang="ts">
	import type { ChatDensity } from '@astryx-svelte/core';
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		Text,
		VStack
	} from '@astryx-svelte/core';

	const DENSITIES: Array<{ density: ChatDensity; label: string }> = [
		{ density: 'compact', label: 'Compact' },
		{ density: 'balanced', label: 'Balanced' },
		{ density: 'spacious', label: 'Spacious' }
	];
</script>

<VStack gap={5} style="width: 100%; max-width: 400px">
	{#each DENSITIES as { density, label } (density)}
		<VStack gap={1}>
			<Text type="supporting" color="secondary">{label}</Text>
			<ChatMessageList {density}>
				<ChatMessage sender="assistant">
					<ChatMessageBubble>The build completed in 4.2 seconds.</ChatMessageBubble>
				</ChatMessage>
				<ChatMessage sender="user">
					<ChatMessageBubble>Ship it to staging.</ChatMessageBubble>
				</ChatMessage>
			</ChatMessageList>
		</VStack>
	{/each}
</VStack>
