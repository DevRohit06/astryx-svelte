<!--
	Ported from upstream's `assets/templates/pages/shell-side-nav/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Upstream's `ConversationItem` is a component with two `useState`s; a page
	template is a single `+page.svelte` (the CLI copies `PAGE_SOURCE_FILE` and
	nothing else), and a snippet cannot hold per-instance state. The two flags
	are hoisted onto the page as the label of the hovered row and the label of
	the row whose menu is open — exactly one of each can be true at a time, so
	the rendering is identical.
-->
<script lang="ts">
	import {
		AppShell,
		Card,
		Divider,
		HStack,
		Icon,
		Layout,
		LayoutContent,
		LayoutFooter,
		MoreMenu,
		NavIcon,
		SideNav,
		SideNavHeading,
		SideNavItem,
		SideNavSection,
		Stack,
		StatusDot,
		VStack,
		type IconName,
		type StatusDotVariant
	} from '@astryx-svelte/core';
	import { SparklesIcon } from '@fvilers/heroicons-svelte/24/outline';

	type Conversation = {
		label: string;
		status: StatusDotVariant;
		statusLabel: string;
	};

	type Workspace = {
		name: string;
		icon: IconName;
		chats: Conversation[];
	};

	const WORKSPACES: Workspace[] = [
		{
			name: 'Personal',
			icon: 'info',
			chats: [
				{ label: 'Weekend trip planning', status: 'success', statusLabel: 'Active' },
				{ label: 'Recipe ideas for the week', status: 'neutral', statusLabel: 'Idle' },
				{ label: 'Book recommendations', status: 'warning', statusLabel: 'Needs review' },
				{ label: 'Home workout plan', status: 'neutral', statusLabel: 'Idle' }
			]
		},
		{
			name: 'Acme Corp',
			icon: 'stop',
			chats: [
				{ label: 'Q3 roadmap draft', status: 'accent', statusLabel: 'In progress' },
				{ label: 'Customer onboarding flow', status: 'success', statusLabel: 'Active' },
				{ label: 'Pricing strategy review', status: 'warning', statusLabel: 'Needs review' },
				{ label: 'Standup summary', status: 'neutral', statusLabel: 'Idle' }
			]
		},
		{
			name: 'Open Source',
			icon: 'wrench',
			chats: [
				{ label: 'StyleX migration notes', status: 'accent', statusLabel: 'In progress' },
				{ label: 'Skeleton loading states', status: 'success', statusLabel: 'Active' },
				{ label: 'Accessibility audit', status: 'error', statusLabel: 'Blocked' },
				{ label: 'Release notes v4.0', status: 'neutral', statusLabel: 'Idle' }
			]
		}
	];

	const SELECTED_CHAT = 'StyleX migration notes';

	const MESSAGES = [
		{ role: 'assistant', width: '78%', height: 104 },
		{ role: 'user', width: '48%', height: 48 },
		{ role: 'assistant', width: '64%', height: 132 },
		{ role: 'user', width: '38%', height: 40 }
	];

	// `ConversationItem`'s `isHovered` / `isMenuOpen`, hoisted (see the note above).
	let hoveredChat = $state<string | null>(null);
	let openMenuChat = $state<string | null>(null);
</script>

{#snippet conversationItem(chat: Conversation, isSelected: boolean)}
	{@const showMenu = hoveredChat === chat.label || openMenuChat === chat.label}
	{#snippet endContent()}
		{#if showMenu}
			<MoreMenu
				size="sm"
				label="Conversation options"
				onOpenChange={(isOpen) => (openMenuChat = isOpen ? chat.label : null)}
				items={[
					{ label: 'Pin', onClick: () => {} },
					{ label: 'Rename', onClick: () => {} },
					{ label: 'Archive', onClick: () => {} },
					{ label: 'Delete', onClick: () => {} }
				]}
			/>
		{:else}
			<StatusDot variant={chat.status} label={chat.statusLabel} />
		{/if}
	{/snippet}
	<Stack
		onmouseenter={() => (hoveredChat = chat.label)}
		onmouseleave={() => (hoveredChat = null)}
	>
		<SideNavItem label={chat.label} href="#" {isSelected} {endContent} />
	</Stack>
{/snippet}

{#snippet sparklesIcon()}<Icon icon={SparklesIcon} size="sm" />{/snippet}
{#snippet headingIcon()}<NavIcon icon={sparklesIcon} />{/snippet}

{#snippet header()}
	<SideNavHeading heading="AI Assistant" icon={headingIcon} headingHref="#" />
{/snippet}

{#snippet sideNavFooter()}
	<SideNavSection title="Account" isHeaderHidden>
		<SideNavItem label="Settings" icon="wrench" href="#" />
		<SideNavItem label="Sarah Chen" icon="info" href="#" />
	</SideNavSection>
{/snippet}

{#snippet sideNav()}
	<SideNav
		collapsible
		resizable={{ defaultWidth: 300, minWidth: 220, maxWidth: 420 }}
		{header}
		footer={sideNavFooter}
	>
		<SideNavSection title="Menu" isHeaderHidden>
			<SideNavItem label="New chat" icon="check" href="#" />
			<SideNavItem label="Search" icon="search" href="#" />
			<SideNavItem label="Library" icon="copy" href="#" />
		</SideNavSection>
		<Divider />
		<SideNavSection title="Workspaces" isHeaderHidden>
			{#each WORKSPACES as workspace (workspace.name)}
				<SideNavItem
					label={workspace.name}
					icon={workspace.icon}
					collapsible={{ defaultIsCollapsed: false }}
				>
					<VStack gap={0.5}>
						{#each workspace.chats as chat (chat.label)}
							{@render conversationItem(chat, chat.label === SELECTED_CHAT)}
						{/each}
					</VStack>
				</SideNavItem>
			{/each}
		</SideNavSection>
	</SideNav>
{/snippet}

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={5}>
			{#each MESSAGES as message, mi (mi)}
				<HStack hAlign={message.role === 'assistant' ? 'start' : 'end'}>
					<Card variant="muted" padding={0} width={message.width} height={message.height} />
				</HStack>
			{/each}
		</VStack>
	</LayoutContent>
{/snippet}

{#snippet layoutFooter()}
	<LayoutFooter>
		<Card variant="muted" padding={0} width="100%" height={56} />
	</LayoutFooter>
{/snippet}

<AppShell contentPadding={0} {sideNav}>
	<Layout height="fill" contentWidth={768} {content} footer={layoutFooter} />
</AppShell>
