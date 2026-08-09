<!--
	Ported from upstream's `assets/templates/pages/ai-chat/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons, which has no Svelte build, so every icon is a
	registry substitution: `XMarkIcon` → `close` and `ChevronRightIcon` →
	`chevronRight` are true matches, `ClipboardDocumentIcon` → `copy` is near
	enough; the rest are stand-ins with no registry glyph — `DocumentTextIcon` →
	`menu` (ruled lines, but it reads as a hamburger), `ShareIcon` →
	`externalLink`, `AtSymbolIcon` → `moreHorizontal`, `PaperClipIcon` →
	`arrowUp`. Retires with the icon registry (TODO.md).

	Upstream's `CSSProperties` consts become `style` strings under the same names
	and key order, because Svelte's `style` prop is a string; that includes
	`artifactPanelWidthVar`, which returns the custom-property declaration.

	`AI_CHAT_CSS` is injected upstream through an inline `<style>` inside the
	root VStack. A Svelte `<style>` must be top level, so it moved to the block
	at the foot of this file — see the note there for why its two rules are
	`:global` and why the breakpoint is written out rather than interpolated.

	`ArtifactActions`, `MobileArtifactActions`, `ArtifactBody` and `ArtifactCard`
	are local components upstream; they hold no state, so they transcribe to
	snippets. That matters because a page template is a single `+page.svelte` —
	the CLI copies `PAGE_SOURCE_FILE` and nothing beside it.

	`Button`'s `onClick` is `onclick` here (it extends the DOM attributes), and
	`ClickableCard`'s likewise; `Markdown` and `ChatTokenizedText` take their
	`children` as a string prop on both sides, so the text is passed rather than
	written between the tags. Upstream writes those markdown/code strings inline
	as JSX children; a template literal nested in indented markup would carry the
	indentation into the markdown, so each is hoisted to a const — the same move
	the ported `Markdown` examples make. Content is unchanged.

	`ArtifactCard` becomes `artifactCardView`: upstream's component and its
	`artifactCard` style const live in different scopes, and a Svelte snippet
	shares one with the const.
-->
<script lang="ts">
	import {
		Avatar,
		Button,
		Card,
		ChatComposer,
		ChatComposerInput,
		ChatLayout,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		ChatSystemMessage,
		ChatTokenizedText,
		ChatToolCalls,
		ClickableCard,
		CodeBlock,
		Dialog,
		DialogHeader,
		DropdownMenu,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		Markdown,
		MoreMenu,
		ResizeHandle,
		Section,
		StackItem,
		Text,
		Timestamp,
		Token,
		Toolbar,
		VStack,
		useResizable
	} from '@astryx-svelte/core';

	// Below this width the split-pane collapses to a single chat column. Shared by
	// the CSS container query and the JS check in openArtifact so they can't drift.
	const MOBILE_MAX_WIDTH = 767;

	const root =
		'height: 100dvh; width: 100%; container-type: inline-size; container-name: artifact;';
	const chatColumn = 'flex: 1; width: 100%; min-width: 0; height: 100%;';
	const chatLayout = 'flex: 1; min-height: 0;';
	const artifactCard = 'margin-block-start: var(--spacing-2);';
	const artifactScroll = 'flex: 1; overflow-y: auto;';
	const articleBody = 'max-width: 720px; margin-inline: auto;';

	// Runtime width for the artifact panel, passed in via the --artifact-panel-width
	// custom property so the MOBILE container query can still override it to 100%
	// (an inline `width` would beat the class rule). The container query lives in a
	// plain <style> block below so it needs NO CSS compiler.
	const artifactPanelWidthVar = (size: number | string): string =>
		`--artifact-panel-width: ${typeof size === 'number' ? `${size}px` : size};`;

	// Artifact content

	const MENTION_TOKENS = [{ value: '@agent', label: '@Agent', variant: 'blue' as const }];

	const ARTIFACT_TITLE = 'JWT Token Refresh: Design & Rollout';

	const ARTIFACT_SUBTITLE = 'Document · Updated just now';

	const ARTIFACT_CONTENT = `## Overview

Our API gateway authenticates every request with a short-lived JWT access token. Until now, an expired token meant an immediate \`401\` — even when the user still held a valid refresh token. This document describes the silent-refresh flow we just shipped and how we're rolling it out.

## The Problem

Token validation ran **before** any refresh logic, so the middleware rejected expired tokens outright:

1. A request arrives with an expired access token
2. \`validateToken()\` throws \`TokenExpiredError\`
3. The catch block returns \`401\` — \`refreshToken()\` is never reached

The result was users getting logged out whenever an access token lapsed mid-session.

## The Fix

The middleware now catches \`TokenExpiredError\` specifically and attempts a silent refresh before rejecting. On success it reissues an access token and continues the request; on failure it falls back to \`401\`.

- **Transparent** — valid sessions never see an interruption
- **Safe** — a missing or invalid refresh token still returns \`401\`
- **Cheap** — refresh only runs on the expiry path, not on every request

## Testing

The refresh path is covered end to end:

| Scenario | Expected |
|----------|----------|
| Valid token passes through | \`200\` |
| Expired token, valid refresh | \`200\` + new access token |
| Expired token, invalid refresh | \`401\` |
| Malformed token | \`401\` |

## Rollout & Monitoring

1. Ship behind the \`silent_refresh\` flag at 5% of traffic
2. Watch the \`auth.refresh.success\` and \`auth.refresh.failure\` counters
3. Alert if the failure rate exceeds **2%** over any 5-minute window
4. Ramp to 100% once metrics hold steady for 24 hours`;

	const AGENT_FINDINGS = `Found the issue. In \`middleware.ts\`, the token validation runs **before** the refresh check. When a token expires, the middleware rejects the request immediately instead of attempting a refresh.

Here's the problematic sequence:

1. Request arrives with an expired access token
2. \`validateToken()\` throws \`TokenExpiredError\`
3. The catch block returns \`401\` — never reaching \`refreshToken()\`

The fix is to catch \`TokenExpiredError\` specifically and attempt a refresh before rejecting:`;

	const MIDDLEWARE_CODE = `async function authMiddleware(req: Request) {
  try {
    const decoded = validateToken(req.headers.authorization);
    req.user = decoded;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      // Attempt silent refresh before rejecting
      const refreshed = await refreshToken(req.cookies.refreshToken);
      if (refreshed) {
        req.user = refreshed.user;
        req.newAccessToken = refreshed.accessToken;
        return next(req);
      }
    }
    return new Response('Unauthorized', { status: 401 });
  }
  return next(req);
}`;

	const AGENT_TEST_RESULTS = `Added a test for the refresh flow. All **4 tests** pass:

| Test | Status |
|------|--------|
| Valid token passes through | ✅ |
| Expired token triggers refresh | ✅ |
| Expired token with invalid refresh returns 401 | ✅ |
| Malformed token returns 401 immediately | ✅ |`;

	const MIDDLEWARE_TEST_CODE = `describe('authMiddleware', () => {
  it('refreshes an expired token silently', async () => {
    const expiredToken = createExpiredJWT(mockUser);
    const validRefresh = createRefreshToken(mockUser);

    const req = mockRequest({
      authorization: \`Bearer \${expiredToken}\`,
      cookies: { refreshToken: validRefresh },
    });

    const res = await authMiddleware(req);

    expect(res.status).toBe(200);
    expect(req.user.id).toBe(mockUser.id);
    expect(req.newAccessToken).toBeDefined();
  });
});`;

	const AGENT_ARTIFACT_INTRO = `I've drafted a design doc covering the problem, the fix, and the test matrix — pulling straight from the changes we just made.\n\nOpen the document below to review it. Want me to expand any section?`;

	const AGENT_ROLLOUT_INTRO = `On it — adding a **Rollout & Monitoring** section with a staged flag ramp and the alert thresholds. Updating the document now.`;

	// Main component

	let composerMode = $state('ask');
	// Mobile shows the artifact as a full-screen dialog; desktop as a side panel.
	let isArtifactDialogOpen = $state(false);
	let isArtifactOpen = $state(true);
	let rootEl: HTMLElement | null = $state(null);
	const artifactResize = useResizable(() => ({
		defaultSize: 640,
		minSizePx: 480,
		maxSizePx: 960,
		autoSaveId: 'ai-chat-artifact-panel'
	}));

	// Match the container-query breakpoint by measuring the root, not the viewport.
	const openArtifact = () => {
		const width = rootEl?.offsetWidth ?? Infinity;
		if (width <= MOBILE_MAX_WIDTH) {
			isArtifactDialogOpen = true;
		} else {
			isArtifactOpen = true;
		}
	};
</script>

<!-- Artifact subviews -->

{#snippet copyIcon()}<Icon icon="copy" size="sm" />{/snippet}
{#snippet shareIcon()}<Icon icon="externalLink" size="sm" />{/snippet}
{#snippet closeIcon()}<Icon icon="close" size="sm" />{/snippet}

<!--
	Header actions: version menu, copy, share. Pass `onClose` for the desktop
	close button. A fragment so each control is a direct child of the toolbar.
-->
{#snippet artifactActions(onClose?: () => void)}
	<DropdownMenu
		button={{
			label: 'v2',
			variant: 'ghost',
			size: 'sm'
		}}
		items={[{ label: 'v2 (current)' }, { label: 'v1' }]}
	/>
	<Button label="Copy" variant="ghost" size="sm" icon={copyIcon} isIconOnly />
	<Button label="Share" variant="ghost" size="sm" icon={shareIcon} isIconOnly />
	{#if onClose != null}
		<Button
			label="Close document"
			variant="ghost"
			size="sm"
			icon={closeIcon}
			isIconOnly
			onclick={onClose}
		/>
	{/if}
{/snippet}

<!-- Mobile variant: the actions collapse into an overflow menu. -->
{#snippet mobileArtifactActions()}
	<MoreMenu
		label="Document actions"
		size="sm"
		items={[
			{
				type: 'section',
				title: 'Version',
				items: [
					{ label: 'v2 (current)', onClick: () => {} },
					{ label: 'v1', onClick: () => {} }
				]
			},
			{ type: 'divider' },
			{ label: 'Copy', icon: 'copy' },
			{ label: 'Share', icon: 'externalLink' }
		]}
	/>
{/snippet}

<!-- Scrollable artifact body — the formatted document. -->
{#snippet artifactBody()}
	<Section variant="transparent" style={artifactScroll}>
		<VStack gap={2} style={articleBody}>
			<Heading level={1}>{ARTIFACT_TITLE}</Heading>
			<Markdown children={ARTIFACT_CONTENT} />
		</VStack>
	</Section>
{/snippet}

<!-- In-message card that opens the artifact panel/dialog. -->
{#snippet artifactCardView(onOpen: () => void)}
	<ClickableCard
		label={`Open ${ARTIFACT_TITLE}`}
		onclick={onOpen}
		variant="muted"
		padding={3}
		maxWidth={360}
		style={artifactCard}
	>
		<HStack gap={3} vAlign="center" width="100%">
			<Icon icon="menu" size="md" color="secondary" />
			<StackItem size="fill">
				<VStack gap={0}>
					<Text type="label" weight="semibold">
						{ARTIFACT_TITLE}
					</Text>
					<Text type="supporting" color="secondary">Document</Text>
				</VStack>
			</StackItem>
			<Icon icon="chevronRight" size="sm" color="secondary" />
		</HStack>
	</ClickableCard>
{/snippet}

<!-- Composer -->

{#snippet composerInputSlot()}<ChatComposerInput />{/snippet}
{#snippet mentionIcon()}<Icon icon="moreHorizontal" size="sm" />{/snippet}
{#snippet attachIcon()}<Icon icon="arrowUp" size="sm" />{/snippet}

{#snippet composerHeaderActions()}
	<Button label="Mention" variant="ghost" size="sm" icon={mentionIcon} isIconOnly />
	<Button label="Attach" variant="ghost" size="sm" icon={attachIcon} isIconOnly />
{/snippet}

{#snippet composerFooterActions()}
	<DropdownMenu
		button={{
			label: composerMode === 'ask' ? 'Ask' : 'Edit',
			variant: 'ghost',
			size: 'sm'
		}}
		items={[
			{
				label: 'Ask',
				onClick: () => (composerMode = 'ask')
			},
			{
				label: 'Edit',
				onClick: () => (composerMode = 'edit')
			}
		]}
	/>
{/snippet}

{#snippet composer()}
	<ChatComposer
		onSubmit={() => {}}
		placeholder={composerMode === 'ask' ? 'Ask anything...' : 'Describe your edit...'}
		input={composerInputSlot}
		headerActions={composerHeaderActions}
		footerActions={composerFooterActions}
	/>
{/snippet}

<!-- Message metadata -->

{#snippet agentAvatar()}<Avatar name="Agent" size="md" />{/snippet}

{#snippet userReviewTimestamp()}<Timestamp value="2026-04-29T10:15:00" format="time" />{/snippet}
{#snippet userReviewMetadata()}<ChatMessageMetadata timestamp={userReviewTimestamp} />{/snippet}

{#snippet agentFindingsTimestamp()}<Timestamp value="2026-04-29T10:15:30" format="time" />{/snippet}
{#snippet agentFindingsFooter()}
	<Text type="supporting" color="secondary">Agent</Text>
{/snippet}

{#snippet userFollowUpTimestamp()}<Timestamp value="2026-04-29T10:16:00" format="time" />{/snippet}
{#snippet userFollowUpMetadata()}
	<ChatMessageMetadata timestamp={userFollowUpTimestamp} status="delivered" />
{/snippet}

{#snippet agentTestsTimestamp()}<Timestamp value="2026-04-29T10:16:45" format="time" />{/snippet}

{#snippet userDocRequestTimestamp()}
	<Timestamp value="2026-04-29T10:18:00" format="time" />
{/snippet}
{#snippet userDocRequestMetadata()}
	<ChatMessageMetadata timestamp={userDocRequestTimestamp} />
{/snippet}

{#snippet agentArtifactTimestamp()}<Timestamp value="2026-04-29T10:18:40" format="time" />{/snippet}

{#snippet userRolloutTimestamp()}<Timestamp value="2026-04-29T10:20:00" format="time" />{/snippet}
{#snippet userRolloutMetadata()}
	<ChatMessageMetadata timestamp={userRolloutTimestamp} status="delivered" />
{/snippet}

{#snippet agentRolloutTimestamp()}<Timestamp value="2026-04-29T10:20:30" format="time" />{/snippet}

<!-- Artifact panel header -->

{#snippet toolbarStartContent()}
	<HStack gap={3} vAlign="center">
		<Icon icon="menu" size="sm" color="secondary" />
		<VStack gap={0}>
			<Text type="label" weight="semibold">
				{ARTIFACT_TITLE}
			</Text>
			<Text type="supporting" color="secondary">
				{ARTIFACT_SUBTITLE}
			</Text>
		</VStack>
	</HStack>
{/snippet}

{#snippet toolbarEndContent()}
	{@render artifactActions(() => (isArtifactOpen = false))}
{/snippet}

<!-- Page -->

{#snippet content()}
	<LayoutContent padding={0}>
		<HStack height="100%">
			<!-- Chat column — flexes to fill the space the artifact leaves -->
			<VStack style={chatColumn}>
				<ChatLayout density="spacious" style={chatLayout} {composer}>
					<ChatMessageList>
						<!-- Date divider -->
						<ChatSystemMessage variant="divider">Today</ChatSystemMessage>

						<!-- User message: mention + file attachments -->
						<ChatMessage sender="user">
							<HStack gap={1} wrap="wrap">
								<Token label="auth-service.ts" />
								<Token label="middleware.ts" />
							</HStack>
							<ChatMessageBubble metadata={userReviewMetadata}>
								<ChatTokenizedText
									tokens={MENTION_TOKENS}
									children="@agent Can you review these auth files? The JWT refresh logic seems broken — tokens expire but the middleware doesn't catch it."
								/>
							</ChatMessageBubble>
						</ChatMessage>

						<!-- Assistant message: tool calls, markdown, code block -->
						<ChatMessage sender="assistant" avatar={agentAvatar}>
							<ChatMessageBubble variant="ghost">
								Looking into the auth files now. Let me read through the code and trace the token
								refresh flow.
							</ChatMessageBubble>
							<ChatToolCalls
								defaultIsExpanded
								calls={[
									{
										name: 'read',
										target: 'auth-service.ts',
										status: 'complete',
										duration: '45ms'
									},
									{
										name: 'read',
										target: 'middleware.ts',
										status: 'complete',
										duration: '38ms'
									},
									{
										name: 'bash',
										target: 'grep -rn "refreshToken" src/',
										status: 'complete',
										duration: '120ms',
										node: 'cli:remote-server'
									}
								]}
							/>

							<ChatMessageBubble variant="ghost">
								<Markdown density="compact" children={AGENT_FINDINGS} />
							</ChatMessageBubble>

							<ChatMessageBubble variant="ghost">
								<CodeBlock title="middleware.ts" language="typescript" code={MIDDLEWARE_CODE} />
							</ChatMessageBubble>

							<ChatToolCalls
								calls={[
									{
										name: 'edit',
										target: 'middleware.ts',
										status: 'complete',
										duration: '85ms',
										additions: 8,
										deletions: 2
									}
								]}
							/>

							<ChatMessageMetadata
								timestamp={agentFindingsTimestamp}
								footer={agentFindingsFooter}
							/>
						</ChatMessage>

						<!-- User message: multi-bubble grouping -->
						<ChatMessage sender="user">
							<ChatMessageBubble group="first">Nice catch, that makes sense</ChatMessageBubble>
							<ChatMessageBubble group="last" metadata={userFollowUpMetadata}>
								Can you also add a test for the refresh path?
							</ChatMessageBubble>
						</ChatMessage>

						<!-- Assistant message: test results table + code block -->
						<ChatMessage sender="assistant" avatar={agentAvatar}>
							<ChatToolCalls
								defaultIsExpanded
								calls={[
									{
										name: 'read',
										target: 'middleware.test.ts',
										status: 'complete',
										duration: '32ms'
									},
									{
										name: 'edit',
										target: 'middleware.test.ts',
										status: 'complete',
										duration: '110ms',
										additions: 24,
										deletions: 0
									},
									{
										name: 'bash',
										target: 'yarn test middleware',
										status: 'complete',
										duration: '3.2s',
										node: 'cli:remote-server'
									}
								]}
							/>
							<ChatMessageBubble variant="ghost">
								<Markdown density="compact" children={AGENT_TEST_RESULTS} />
							</ChatMessageBubble>

							<ChatMessageBubble variant="ghost">
								<CodeBlock
									title="middleware.test.ts"
									language="typescript"
									code={MIDDLEWARE_TEST_CODE}
								/>
							</ChatMessageBubble>
							<ChatMessageMetadata timestamp={agentTestsTimestamp} />
						</ChatMessage>

						<!-- Status message -->
						<ChatSystemMessage>Changes saved to workspace</ChatSystemMessage>

						<!-- User message: requests a document artifact -->
						<ChatMessage sender="user">
							<ChatMessageBubble metadata={userDocRequestMetadata}>
								Looks solid. Before I open the PR, can you write up a short design doc explaining the
								token-refresh flow for the team?
							</ChatMessageBubble>
						</ChatMessage>

						<!-- Assistant message: artifact card -->
						<ChatMessage sender="assistant" avatar={agentAvatar}>
							<ChatMessageBubble variant="ghost">
								<Markdown density="compact" children={AGENT_ARTIFACT_INTRO} />
							</ChatMessageBubble>
							{@render artifactCardView(openArtifact)}
							<ChatMessageMetadata timestamp={agentArtifactTimestamp} />
						</ChatMessage>

						<!-- User follow-up -->
						<ChatMessage sender="user">
							<ChatMessageBubble metadata={userRolloutMetadata}>
								This is great. Can you add a section on rollout and monitoring at the end?
							</ChatMessageBubble>
						</ChatMessage>

						<!-- Assistant message: in-progress tool call -->
						<ChatMessage sender="assistant" avatar={agentAvatar}>
							<ChatMessageBubble variant="ghost">
								<Markdown density="compact" children={AGENT_ROLLOUT_INTRO} />
							</ChatMessageBubble>
							<ChatToolCalls
								calls={[
									{
										name: 'edit',
										target: 'docs/token-refresh.md',
										status: 'running',
										node: 'cli:remote-server'
									}
								]}
							/>
							<ChatMessageMetadata timestamp={agentRolloutTimestamp} />
						</ChatMessage>
					</ChatMessageList>
				</ChatLayout>
			</VStack>

			<!-- Desktop split-pane: resize handle + artifact panel -->
			{#if isArtifactOpen}
				<ResizeHandle
					direction="horizontal"
					resizable={artifactResize.props}
					isReversed
					pillPlacement="start"
					hasDivider
					label="Resize artifact panel"
					class="ai-chat-resize-handle"
				/>

				<!-- Toolbar as the card header, body below -->
				<Card
					variant="transparent"
					height="100%"
					class="ai-chat-artifact-panel"
					style={artifactPanelWidthVar(artifactResize.size)}
				>
					<Toolbar
						label="Artifact actions"
						dividers={['bottom']}
						startContent={toolbarStartContent}
						endContent={toolbarEndContent}
					/>

					{@render artifactBody()}
				</Card>
			{/if}
		</HStack>
	</LayoutContent>
{/snippet}

{#snippet dialogHeader()}
	<DialogHeader
		title={ARTIFACT_TITLE}
		subtitle={ARTIFACT_SUBTITLE}
		hasDivider
		onOpenChange={(isOpen) => (isArtifactDialogOpen = isOpen)}
		endContent={mobileArtifactActions}
	/>
{/snippet}

{#snippet dialogContent()}
	<LayoutContent padding={0}>
		{@render artifactBody()}
	</LayoutContent>
{/snippet}

<VStack
	{@attach (el) => {
		rootEl = el as HTMLElement;
	}}
	style={root}
>
	<Layout height="fill" {content} />
	<!-- Mobile artifact view — full-screen Dialog -->
	<Dialog
		isOpen={isArtifactDialogOpen}
		onOpenChange={(isOpen) => (isArtifactDialogOpen = isOpen)}
		purpose="info"
		variant="fullscreen"
	>
		<Layout header={dialogHeader} content={dialogContent} />
	</Dialog>
</VStack>

<style>
	/*
		Upstream injects these rules through an inline `<style>{AI_CHAT_CSS}</style>`
		placed inside the root VStack; a Svelte `<style>` must be top level, so the
		stylesheet moved here.

		Both class names land on components (`ResizeHandle`, `Card`) rather than on
		DOM elements, and Svelte's scoper only stamps elements — a scoped rule would
		be dropped as unused. `:global` is therefore required, and it also matches
		upstream's injected stylesheet, which is not scoped either.

		`MOBILE_MAX_WIDTH` cannot be interpolated into a static `<style>`, so the
		breakpoint is written out here; the script const stays the single value the
		JS check in `openArtifact` reads.
	*/
	:global(.ai-chat-resize-handle) {
		display: flex;
	}

	:global(.ai-chat-artifact-panel) {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		width: var(--artifact-panel-width);
		flex-shrink: 0;
	}

	@container artifact (max-width: 767px) {
		:global(.ai-chat-resize-handle) {
			display: none;
		}

		:global(.ai-chat-artifact-panel) {
			display: none;
			width: 100%;
			flex-shrink: 1;
		}
	}
</style>
