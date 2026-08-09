<!--
	Ported from upstream's `assets/templates/pages/messaging-shell/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`HomeIcon` → `viewColumns`, `ChatBubbleLeftRightIcon` → `moreHorizontal`,
	`BellIcon` → `warning`, `BookmarkIcon` → `stop`, `Cog6ToothIcon` → `wrench`,
	`PencilSquareIcon` → `copy`, `HashtagIcon` → `menu`, `UserGroupIcon` →
	`info`, `InboxIcon` → `arrowDown`. `MagnifyingGlassIcon` → `search` and
	`XMarkIcon` → `close` are true matches; the rest are stand-ins. Retires with
	the icon registry (TODO.md).

	Upstream's `styles` is a `Record<string, CSSProperties>` applied through the
	`style` prop; here it is a `Record<string, string>` of the same declarations,
	because Svelte's `style` prop is a string. A scoped `<style>` block would not
	do — Svelte scopes the selector, not a class passed to a component — and
	these styles land on `Stack`/`StackItem`/`VStack` as often as on a `<div>`.

	Upstream's `StreamMessageGroup` is a component; it holds no state, so it
	transcribes to a parameterised snippet. That matters because a page template
	is a single `+page.svelte` — the CLI copies `PAGE_SOURCE_FILE` and nothing
	beside it.
-->
<script lang="ts">
	/**
	 * Messaging Shell — Slack-style column frame for team messaging tools.
	 *
	 * Frame (desktop, left to right):
	 *   workspace rail 68px | channel sidebar 260px | message stream (fill) | thread panel 340px
	 *
	 * Container policy: dense rows, zero Cards. Channels and DMs are List/ListItem
	 * rows, presence is AvatarStatusDot/StatusDot, unread counts are the only
	 * Badge usage. The stream and thread are built on the Chat component family.
	 *
	 * Responsive contract:
	 *   >1024px  — full four-column frame (rail | sidebar | stream | thread)
	 *   <=1024px — thread panel hidden; stream takes the reclaimed width
	 *   <=768px  — sidebar also hidden; rail + stream keep full width
	 *
	 * Fixtures are deterministic: fixed ISO timestamps rendered via <Timestamp>,
	 * no Date.now()/Math.random() anywhere.
	 */

	import {
		Avatar,
		AvatarStatusDot,
		Badge,
		ChatComposer,
		ChatLayout,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		ChatSystemMessage,
		Divider,
		EmptyState,
		HStack,
		Heading,
		Icon,
		IconButton,
		Layout,
		LayoutContent,
		LayoutPanel,
		List,
		ListItem,
		Stack,
		StackItem,
		StatusDot,
		Text,
		TextInput,
		Timestamp,
		VStack,
		useMediaQuery,
		type IconName
	} from '@astryx-svelte/core';

	// ---------------------------------------------------------------------------
	// Styles — plain CSS properties with semantic tokens only.
	// ---------------------------------------------------------------------------

	const styles: Record<string, string> = {
		root: 'height: 100dvh; width: 100%;',
		rail: 'height: 100%; align-items: center; padding-top: var(--spacing-3); padding-bottom: var(--spacing-3);',
		railSpacer: 'flex: 1;',
		sidebar: 'height: 100%; min-height: 0;',
		sidebarHeader:
			'align-items: center; padding-inline: var(--spacing-3); padding-block: var(--spacing-3);',
		sidebarSearch: 'padding-inline: var(--spacing-3); padding-bottom: var(--spacing-2);',
		sidebarScroll:
			'min-height: 0; overflow-y: auto; padding-inline: var(--spacing-2); padding-bottom: var(--spacing-3);',
		sectionGap: 'margin-top: var(--spacing-4);',
		streamColumn: 'height: 100%; min-height: 0;',
		streamHeader:
			'align-items: center; padding-inline: var(--spacing-4); padding-block: var(--spacing-3);',
		streamTopic: 'min-width: 0;',
		chatArea: 'min-height: 0; display: flex; flex-direction: column;',
		chatFill: 'flex: 1; min-height: 0;',
		threadColumn: 'height: 100%; min-height: 0;',
		threadHeader:
			'align-items: center; padding-inline: var(--spacing-3); padding-block: var(--spacing-2);',
		threadScroll:
			'min-height: 0; overflow-y: auto; padding-inline: var(--spacing-3); padding-block: var(--spacing-3);',
		threadComposer: 'padding: var(--spacing-3);'
	};

	// ---------------------------------------------------------------------------
	// Deterministic fixtures — fixed ISO timestamps, stable ordering.
	// ---------------------------------------------------------------------------

	type Presence = 'online' | 'busy' | 'offline';

	interface User {
		name: string;
	}

	const USERS: Record<string, User> = {
		mira: { name: 'Mira Chen' },
		devon: { name: 'Devon Park' },
		sasha: { name: 'Sasha Ortiz' },
		you: { name: 'Riley Quinn' }
	};

	interface Channel {
		id: string;
		name: string;
		topic: string;
		unread: number;
	}

	const CHANNELS: Channel[] = [
		{
			id: 'design-systems',
			name: 'design-systems',
			topic: 'Component APIs, tokens, and release coordination',
			unread: 0
		},
		{
			id: 'frontend-guild',
			name: 'frontend-guild',
			topic: 'Cross-team frontend practices',
			unread: 4
		},
		{
			id: 'releases',
			name: 'releases',
			topic: 'Release announcements and rollbacks',
			unread: 12
		},
		{ id: 'random', name: 'random', topic: 'Everything else', unread: 0 }
	];

	interface DirectMessage {
		id: string;
		userId: string;
		presence: Presence;
		unread: number;
	}

	const DIRECT_MESSAGES: DirectMessage[] = [
		{ id: 'dm-mira', userId: 'mira', presence: 'online', unread: 0 },
		{ id: 'dm-devon', userId: 'devon', presence: 'busy', unread: 2 },
		{ id: 'dm-sasha', userId: 'sasha', presence: 'offline', unread: 0 }
	];

	// AvatarStatusDot supports success | neutral | error (no warning).
	const PRESENCE_VARIANT: Record<Presence, 'success' | 'error' | 'neutral'> = {
		online: 'success',
		busy: 'error',
		offline: 'neutral'
	};

	const PRESENCE_LABEL: Record<Presence, string> = {
		online: 'Online',
		busy: 'Busy',
		offline: 'Offline'
	};

	/** One message group: consecutive bubbles from the same sender. */
	interface StreamMessage {
		id: string;
		userId: string;
		time: string;
		bubbles: string[];
	}

	const MESSAGES_BY_CHANNEL: Record<string, StreamMessage[]> = {
		'design-systems': [
			{
				id: 'm1',
				userId: 'mira',
				time: '2026-06-30T09:12:00',
				bubbles: [
					'Morning! The Timestamp component now supports a `system_date` format — worth switching the audit log over.',
					'I put the migration notes in the wiki under Decisions.'
				]
			},
			{
				id: 'm2',
				userId: 'devon',
				time: '2026-06-30T09:15:00',
				bubbles: ['Nice. Does that unblock the incident console timeline work?']
			},
			{
				id: 'm3',
				userId: 'you',
				time: '2026-06-30T09:17:00',
				bubbles: [
					'It does — I will pick that up after the template review.',
					'One question on the List density defaults, will start a thread.'
				]
			},
			{
				id: 'm4',
				userId: 'sasha',
				time: '2026-06-30T09:24:00',
				bubbles: [
					'Heads up: the token sync job ran clean overnight, no drift between core and the theme packages.'
				]
			},
			{
				id: 'm5',
				userId: 'mira',
				time: '2026-06-30T09:26:00',
				bubbles: ['Great — closing out the drift task then.']
			}
		],
		'frontend-guild': [
			{
				id: 'g1',
				userId: 'devon',
				time: '2026-06-30T08:40:00',
				bubbles: ['Guild sync moved to Thursday this week to avoid the release freeze.']
			},
			{
				id: 'g2',
				userId: 'you',
				time: '2026-06-30T08:44:00',
				bubbles: ['Works for me — agenda doc is updated.']
			}
		]
	};

	interface ThreadReply {
		id: string;
		userId: string;
		time: string;
		text: string;
	}

	const THREAD_ROOT: ThreadReply = {
		id: 't0',
		userId: 'you',
		time: '2026-06-30T09:17:30',
		text: 'One question on the List density defaults — should channel sidebars use compact or balanced? The spec shows both.'
	};

	const THREAD_REPLIES: ThreadReply[] = [
		{
			id: 't1',
			userId: 'mira',
			time: '2026-06-30T09:19:00',
			text: 'Compact for navigation surfaces. Balanced is for content lists where descriptions carry weight.'
		},
		{
			id: 't2',
			userId: 'devon',
			time: '2026-06-30T09:21:00',
			text: 'Agreed — the sidebar rows here are a good reference implementation.'
		}
	];

	const RAIL_ITEMS: { id: string; label: string; icon: IconName }[] = [
		{ id: 'home', label: 'Home', icon: 'viewColumns' },
		{ id: 'dms', label: 'Direct messages', icon: 'moreHorizontal' },
		{ id: 'activity', label: 'Activity', icon: 'warning' },
		{ id: 'saved', label: 'Saved items', icon: 'stop' }
	];

	// ---------------------------------------------------------------------------
	// Page
	// ---------------------------------------------------------------------------

	let selectedChannelId = $state('design-systems');
	let selectedDmId = $state<string | null>(null);
	let isThreadOpen = $state(true);
	let searchQuery = $state('');

	// Responsive contract (see the docstring above).
	const isThreadHidden = useMediaQuery(() => '(max-width: 1024px)');
	const isSidebarHidden = useMediaQuery(() => '(max-width: 768px)');

	const selectedChannel = $derived(
		CHANNELS.find((channel) => channel.id === selectedChannelId) ?? CHANNELS[0]
	);
	const messages = $derived(MESSAGES_BY_CHANNEL[selectedChannel.id] ?? []);

	const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
	const visibleChannels = $derived(
		CHANNELS.filter((channel) => channel.name.toLowerCase().includes(normalizedQuery))
	);
	const visibleDms = $derived(
		DIRECT_MESSAGES.filter((dm) => USERS[dm.userId].name.toLowerCase().includes(normalizedQuery))
	);

	const showThreadPanel = $derived(isThreadOpen && !isThreadHidden.matches);
</script>

<!--
	Stream message group — avatar + name on the first bubble, timestamp on the
	last, `group` positions tighten corner radii between consecutive bubbles.
-->
{#snippet streamMessageGroup(message: StreamMessage)}
	{@const isSelf = message.userId === 'you'}
	{@const user = USERS[message.userId]}
	{@const lastIndex = message.bubbles.length - 1}
	{#snippet senderAvatar()}<Avatar name={user.name} size="md" />{/snippet}
	<ChatMessage sender={isSelf ? 'user' : 'assistant'} avatar={isSelf ? undefined : senderAvatar}>
		{#each message.bubbles as text, index (`${message.id}-${index}`)}
			{#snippet timestamp()}<Timestamp value={message.time} format="time" />{/snippet}
			{#snippet metadata()}<ChatMessageMetadata {timestamp} />{/snippet}
			<ChatMessageBubble
				group={message.bubbles.length === 1
					? undefined
					: index === 0
						? 'first'
						: index === lastIndex
							? 'last'
							: 'middle'}
				name={!isSelf && index === 0 ? user.name : undefined}
				metadata={index === lastIndex ? metadata : undefined}
			>
				{text}
			</ChatMessageBubble>
		{/each}
	</ChatMessage>
{/snippet}

{#snippet youStatus()}<AvatarStatusDot variant="success" label="Online" />{/snippet}
{#snippet settingsIcon()}<Icon icon="wrench" size="sm" color="inherit" />{/snippet}

{#snippet workspaceRail()}
	<VStack gap={2} style={styles.rail}>
		<Avatar name="Astryx HQ" size="md" />
		{#each RAIL_ITEMS as item (item.id)}
			{#snippet railIcon()}<Icon icon={item.icon} size="sm" color="inherit" />{/snippet}
			<IconButton
				label={item.label}
				tooltip={item.label}
				icon={railIcon}
				variant={item.id === 'home' ? 'secondary' : 'ghost'}
				onclick={() => {}}
			/>
		{/each}
		<div style={styles.railSpacer}></div>
		<IconButton
			label="Settings"
			tooltip="Settings"
			icon={settingsIcon}
			variant="ghost"
			onclick={() => {}}
		/>
		<Avatar name={USERS.you.name} size="md" status={youStatus} />
	</VStack>
{/snippet}

{#snippet newMessageIcon()}<Icon icon="copy" size="sm" color="inherit" />{/snippet}
{#snippet jumpToIcon()}<Icon icon="search" size="sm" />{/snippet}
{#snippet channelsHeader()}
	<Text type="label" size="sm" color="secondary">Channels</Text>
{/snippet}
{#snippet directMessagesHeader()}
	<Text type="label" size="sm" color="secondary">Direct messages</Text>
{/snippet}

{#snippet channelSidebar()}
	<Stack direction="vertical" style={styles.sidebar}>
		<HStack gap={2} style={styles.sidebarHeader}>
			<StackItem size="fill">
				<Heading level={5}>Astryx HQ</Heading>
			</StackItem>
			<IconButton
				label="New message"
				tooltip="New message"
				icon={newMessageIcon}
				variant="ghost"
				size="sm"
				onclick={() => {}}
			/>
		</HStack>
		<div style={styles.sidebarSearch}>
			<TextInput
				label="Jump to"
				isLabelHidden
				size="sm"
				placeholder="Jump to..."
				startIcon={jumpToIcon}
				value={searchQuery}
				onChange={(value) => (searchQuery = value)}
			/>
		</div>
		<StackItem size="fill" style={styles.sidebarScroll}>
			<List density="compact" hasDividers={false} header={channelsHeader}>
				{#each visibleChannels as channel (channel.id)}
					{#snippet hashtagIcon()}<Icon icon="menu" size="sm" color="secondary" />{/snippet}
					{#snippet unreadBadge()}<Badge label={String(channel.unread)} variant="neutral" />{/snippet}
					<ListItem
						label={channel.name}
						isSelected={selectedDmId === null && channel.id === selectedChannelId}
						onclick={() => {
							selectedChannelId = channel.id;
							selectedDmId = null;
						}}
						startContent={hashtagIcon}
						endContent={channel.unread > 0 ? unreadBadge : undefined}
					/>
				{/each}
			</List>
			<div style={styles.sectionGap}>
				<List density="compact" hasDividers={false} header={directMessagesHeader}>
					{#each visibleDms as dm (dm.id)}
						{#snippet presenceDot()}
							<AvatarStatusDot
								variant={PRESENCE_VARIANT[dm.presence]}
								label={PRESENCE_LABEL[dm.presence]}
							/>
						{/snippet}
						{#snippet dmAvatar()}
							<Avatar name={USERS[dm.userId].name} size="sm" status={presenceDot} />
						{/snippet}
						{#snippet dmUnreadBadge()}<Badge label={String(dm.unread)} variant="neutral" />{/snippet}
						<ListItem
							label={USERS[dm.userId].name}
							isSelected={selectedDmId === dm.id}
							onclick={() => (selectedDmId = dm.id)}
							startContent={dmAvatar}
							endContent={dm.unread > 0 ? dmUnreadBadge : undefined}
						/>
					{/each}
				</List>
			</div>
		</StackItem>
	</Stack>
{/snippet}

{#snippet membersIcon()}<Icon icon="info" size="sm" color="inherit" />{/snippet}
{#snippet inboxIcon()}<Icon icon="arrowDown" size="lg" />{/snippet}

{#snippet streamComposer()}
	<ChatComposer placeholder={`Message #${selectedChannel.name}`} onSubmit={() => {}} />
{/snippet}

{#snippet streamEmptyState()}
	<EmptyState
		icon={inboxIcon}
		title="No messages yet"
		description="Start the conversation — messages posted here are visible to the whole channel."
	/>
{/snippet}

{#snippet messageStream()}
	<Stack direction="vertical" style={styles.streamColumn}>
		<HStack gap={3} style={styles.streamHeader}>
			<Icon icon="menu" size="sm" color="secondary" />
			<Heading level={5}>{selectedChannel.name}</Heading>
			<StackItem size="fill" style={styles.streamTopic}>
				<Text type="supporting" color="secondary" maxLines={1}>
					{selectedChannel.topic}
				</Text>
			</StackItem>
			<StatusDot variant="success" label="12 online" />
			<IconButton
				label="Members"
				tooltip="Members"
				icon={membersIcon}
				variant="ghost"
				size="sm"
				onclick={() => {}}
			/>
		</HStack>
		<Divider />
		<StackItem size="fill" style={styles.chatArea}>
			<div style={styles.chatFill}>
				<ChatLayout composer={streamComposer} emptyState={streamEmptyState}>
					{#if messages.length > 0}
						<ChatMessageList density="balanced">
							<ChatSystemMessage variant="divider">Tuesday, June 30</ChatSystemMessage>
							<ChatSystemMessage>Sasha Ortiz joined #{selectedChannel.name}</ChatSystemMessage>
							{#each messages as message (message.id)}
								{@render streamMessageGroup(message)}
							{/each}
						</ChatMessageList>
					{/if}
				</ChatLayout>
			</div>
		</StackItem>
	</Stack>
{/snippet}

{#snippet closeThreadIcon()}<Icon icon="close" size="sm" color="inherit" />{/snippet}
{#snippet threadRootAvatar()}<Avatar name={USERS[THREAD_ROOT.userId].name} size="md" />{/snippet}
{#snippet threadRootTimestamp()}<Timestamp value={THREAD_ROOT.time} format="time" />{/snippet}
{#snippet threadRootMetadata()}<ChatMessageMetadata timestamp={threadRootTimestamp} />{/snippet}

{#snippet threadPanel()}
	<Stack direction="vertical" style={styles.threadColumn}>
		<HStack gap={2} style={styles.threadHeader}>
			<StackItem size="fill">
				<HStack gap={2} style="align-items: baseline;">
					<Text weight="semibold">Thread</Text>
					<Text type="supporting" color="secondary">#{selectedChannel.name}</Text>
				</HStack>
			</StackItem>
			<IconButton
				label="Close thread"
				tooltip="Close thread"
				icon={closeThreadIcon}
				variant="ghost"
				size="sm"
				onclick={() => (isThreadOpen = false)}
			/>
		</HStack>
		<Divider />
		<StackItem size="fill" style={styles.threadScroll}>
			<ChatMessageList density="compact">
				<ChatMessage sender="assistant" avatar={threadRootAvatar}>
					<ChatMessageBubble name={USERS[THREAD_ROOT.userId].name} metadata={threadRootMetadata}>
						{THREAD_ROOT.text}
					</ChatMessageBubble>
				</ChatMessage>
				<ChatSystemMessage variant="divider">{THREAD_REPLIES.length} replies</ChatSystemMessage>
				{#each THREAD_REPLIES as reply (reply.id)}
					{#snippet replyAvatar()}<Avatar name={USERS[reply.userId].name} size="md" />{/snippet}
					{#snippet replyTimestamp()}<Timestamp value={reply.time} format="time" />{/snippet}
					{#snippet replyMetadata()}<ChatMessageMetadata timestamp={replyTimestamp} />{/snippet}
					<ChatMessage sender="assistant" avatar={replyAvatar}>
						<ChatMessageBubble name={USERS[reply.userId].name} metadata={replyMetadata}>
							{reply.text}
						</ChatMessageBubble>
					</ChatMessage>
				{/each}
			</ChatMessageList>
		</StackItem>
		<div style={styles.threadComposer}>
			<ChatComposer density="compact" placeholder="Reply in thread..." onSubmit={() => {}} />
		</div>
	</Stack>
{/snippet}

{#snippet start()}
	<LayoutPanel width={68} padding={0}>
		{@render workspaceRail()}
	</LayoutPanel>
	{#if !isSidebarHidden.matches}
		<LayoutPanel width={260} padding={0}>
			{@render channelSidebar()}
		</LayoutPanel>
	{/if}
{/snippet}

{#snippet end()}
	<LayoutPanel width={340} padding={0}>
		{@render threadPanel()}
	</LayoutPanel>
{/snippet}

{#snippet content()}
	<LayoutContent padding={0}>
		{@render messageStream()}
	</LayoutContent>
{/snippet}

<div style={styles.root}>
	<Layout height="fill" {start} end={showThreadPanel ? end : undefined} {content} />
</div>
