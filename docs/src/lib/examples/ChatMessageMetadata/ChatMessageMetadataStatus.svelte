<!--
	Ported from upstream's `templates/blocks/components/ChatMessageMetadata/ChatMessageMetadataStatus.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The `.map()` stays an `{#each}`, but each row needs a *different* `metadata`
	snippet and a snippet with parameters cannot be pre-applied and handed to a
	prop. So the five are declared separately and selected by status through a
	lookup — the `{@const}` sits directly inside the component tag, which is where
	Svelte allows one.
-->
<script lang="ts">
	import type { ChatMessageStatus } from '@astryx-svelte/core';
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		Timestamp
	} from '@astryx-svelte/core';

	const STATUSES: Array<{ status: ChatMessageStatus; text: string }> = [
		{ status: 'sending', text: 'Deploying the update now…' },
		{ status: 'sent', text: 'Config pushed to staging.' },
		{ status: 'delivered', text: 'Verified on the staging cluster.' },
		{ status: 'read', text: 'Looks good — promoting to prod.' },
		{ status: 'error', text: 'Rollback triggered, checking logs.' }
	];
</script>

{#snippet timestamp()}
	<Timestamp value="2026-04-29T10:15:00" format="time" />
{/snippet}

{#snippet sendingMeta()}<ChatMessageMetadata {timestamp} status="sending" />{/snippet}
{#snippet sentMeta()}<ChatMessageMetadata {timestamp} status="sent" />{/snippet}
{#snippet deliveredMeta()}<ChatMessageMetadata {timestamp} status="delivered" />{/snippet}
{#snippet readMeta()}<ChatMessageMetadata {timestamp} status="read" />{/snippet}
{#snippet errorMeta()}<ChatMessageMetadata {timestamp} status="error" />{/snippet}

<ChatMessageList style="max-width: 400px">
	{@const metaFor = {
		sending: sendingMeta,
		sent: sentMeta,
		delivered: deliveredMeta,
		read: readMeta,
		error: errorMeta
	}}
	{#each STATUSES as { status, text } (status)}
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={metaFor[status]}>{text}</ChatMessageBubble>
		</ChatMessage>
	{/each}
</ChatMessageList>
