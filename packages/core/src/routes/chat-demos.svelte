<script lang="ts">
	import {
		Avatar,
		Button,
		ChatComposer,
		ChatComposerDrawer,
		ChatComposerInput,
		ChatDictationButton,
		ChatLayout,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		ChatSystemMessage,
		ChatTokenizedText,
		ChatToolCalls,
		Markdown,
		Text,
		Timestamp,
		createStaticSource,
		useChatDictation
	} from '$lib/index.js';
	import type { ChatComposerToken, ChatComposerTrigger, ChatToolCallItem } from '$lib/index.js';

	/**
	 * Chat demos, drawn from upstream's `Chat`, `ChatToolCalls`,
	 * `ChatTokenizedText` and `ChatComposer` stories.
	 *
	 * Content is upstream's, not invented: the message text, tool-call names,
	 * token labels and composer configurations are transcribed from the stories,
	 * with `useReducer`/React wording left as upstream wrote it — this page shows
	 * what the components do, and rewriting the copy would make it show something
	 * upstream never shipped.
	 */

	const mentionTokens: ChatComposerToken[] = [
		{ value: '@cindy', label: '@Cindy Zhang', variant: 'blue' },
		{ value: '@navi', label: '@Navi', variant: 'blue' }
	];

	const USERS = [
		{ id: 'cindy', label: 'Cindy Zhang' },
		{ id: 'alex', label: 'Alex Johnson' },
		{ id: 'sam', label: 'Sam Rivera' }
	];

	const COMMANDS = [
		{ id: 'summarize', label: 'summarize' },
		{ id: 'translate', label: 'translate' },
		{ id: 'search', label: 'search' }
	];

	const triggers: ChatComposerTrigger[] = [
		{
			character: '@',
			searchSource: createStaticSource(USERS),
			onSelect: (item) => ({
				value: `@${item.id}`,
				label: `@${item.label}`,
				variant: 'blue' as const
			})
		},
		{
			character: '/',
			searchSource: createStaticSource(COMMANDS),
			onSelect: (item) => `/${item.label} `
		}
	];

	const singleCall: ChatToolCallItem[] = [
		{ name: 'bash', status: 'complete', target: 'git status', duration: '1.2s' }
	];

	const multipleCalls: ChatToolCallItem[] = [
		{ name: 'searchCode', status: 'complete', target: 'ChatComposer', duration: '340ms' },
		{ name: 'readFile', status: 'complete', target: 'ChatComposer.tsx', duration: '120ms' },
		{ name: 'editFile', status: 'running', target: 'ChatComposer.tsx' }
	];

	const withStats: ChatToolCallItem[] = [
		{
			name: 'edit',
			status: 'complete',
			target: 'Button.tsx',
			duration: '85ms',
			node: 'cli:remote-server',
			additions: 24,
			deletions: 8
		},
		{
			name: 'edit',
			status: 'complete',
			target: 'Button.test.tsx',
			duration: '60ms',
			node: 'cli:remote-server',
			additions: 45
		},
		{
			name: 'bash',
			status: 'complete',
			target: 'grep -r "radius"',
			duration: '200ms',
			node: 'cli:remote-server',
			stats: '6 files · 14 matches'
		}
	];

	const allStatuses: ChatToolCallItem[] = [
		{ key: 'pending', name: 'bash', status: 'pending', target: 'yarn build' },
		{ key: 'running', name: 'bash', status: 'running', target: 'yarn test' },
		{
			key: 'complete',
			name: 'edit',
			status: 'complete',
			target: 'Button.tsx',
			duration: '120ms',
			additions: 8,
			deletions: 2
		},
		{
			key: 'error',
			name: 'bash',
			status: 'error',
			target: 'yarn lint',
			duration: '0.8s',
			errorMessage: '3 lint errors found'
		}
	];

	// `Markdown`'s `children` is typed `string` on both sides, so the body is a
	// prop rather than markup — content between the tags would be a `Snippet`.
	const stateManagementAnswer = `For most cases, **React's built-in state** is sufficient:

- \`useState\` for local component state
- \`useReducer\` for complex state logic
- \`useContext\` for shared state across a subtree

Avoid global state managers unless you have a genuine need for cross-cutting state.`;

	// Upstream's `DensityComparison` interpolates the density name into the body
	// and closes with a different sentence per density, so the string is built the
	// same way rather than copied three times.
	type ChatDensity = 'compact' | 'balanced' | 'spacious';

	function densityBody(density: ChatDensity): string {
		const closing =
			density === 'compact'
				? 'Great for sidebars and panels where space is limited.'
				: density === 'spacious'
					? 'Ideal for long-form reading where breathing room helps comprehension.'
					: 'The default — works well for most full-page chat interfaces.';

		return `Density controls **spacing** at every level:

- **Default gap** between messages
- **Padding** inside bubbles
- **Gap** between child elements

Use gap when top-level rows need different spacing from density.

This is the **${density}** density. ${closing}`;
	}

	// --- Composer state ---
	let simplestValue = $state('');
	let submitted = $state<string[]>([]);
	let isStreaming = $state(false);

	const dictation = useChatDictation(() => ({}));
</script>

<!--
	A snippet with a parameter cannot be pre-applied and handed to a prop, so each
	timestamp gets its own — upstream writes `<Timestamp …/>` inline in the JSX
	and there is nothing shorter on this side.
-->
{#snippet userTimestamp()}
	<Timestamp value="2026-03-15T14:30:00" format="time" />
{/snippet}

{#snippet groupTimestamp()}
	<Timestamp value="2026-03-15T14:31:00" format="time" />
{/snippet}

<h3>Message list</h3>
<div class="chat-frame">
	<ChatMessageList>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={userMeta}>
				How should I handle state management in a React app?
			</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="assistant" avatar={naviAvatar}>
			<Markdown density="compact" children={stateManagementAnswer} />
			<ChatMessageMetadata timestamp="2:30 PM" footer="Claude Opus 4.6" />
		</ChatMessage>
	</ChatMessageList>
</div>

{#snippet naviAvatar()}
	<Avatar name="Navi" size="md" />
{/snippet}

{#snippet naviSmall()}
	<Avatar name="Navi" size="sm" />
{/snippet}

{#snippet userMeta()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

<h3>Multi-bubble grouping</h3>
<div class="chat-frame">
	<ChatMessageList>
		<ChatMessage sender="user">
			<ChatMessageBubble group="first">Hey, can you review my PR?</ChatMessageBubble>
			<ChatMessageBubble group="middle">It's the one for the chat components</ChatMessageBubble>
			<ChatMessageBubble group="last" metadata={groupMeta}>
				Link: github.com/facebook/astryx/pull/1180
			</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="assistant" avatar={naviAvatar}>
			<ChatMessageBubble group="first">Sure, looking at it now!</ChatMessageBubble>
			<ChatMessageBubble group="middle">
				The compound pattern looks solid. A few minor comments on the density styles.
			</ChatMessageBubble>
			<ChatMessageBubble group="last" metadata={assistantGroupMeta}>
				I'll leave them as review comments.
			</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={replyMeta}>Thanks, will address those</ChatMessageBubble>
		</ChatMessage>
	</ChatMessageList>
</div>

{#snippet groupMeta()}
	<ChatMessageMetadata timestamp={groupTimestamp} status="delivered" />
{/snippet}

{#snippet assistantGroupTimestamp()}
	<Timestamp value="2026-03-15T14:33:00" format="time" />
{/snippet}

{#snippet assistantGroupMeta()}
	<ChatMessageMetadata timestamp={assistantGroupTimestamp} />
{/snippet}

{#snippet replyTimestamp()}
	<Timestamp value="2026-03-15T14:34:00" format="time" />
{/snippet}

{#snippet replyMeta()}
	<ChatMessageMetadata timestamp={replyTimestamp} status="sending" />
{/snippet}

<h3>Message status</h3>
<div class="chat-frame">
	<ChatMessageList>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={sendingMeta}>Sending...</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={sentMeta}>Sent</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={deliveredMeta}>Delivered</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={readMeta}>Read</ChatMessageBubble>
		</ChatMessage>
		<ChatMessage sender="user">
			<ChatMessageBubble metadata={errorMeta}>Failed to send</ChatMessageBubble>
		</ChatMessage>
	</ChatMessageList>
</div>

{#snippet sendingMeta()}<ChatMessageMetadata status="sending" />{/snippet}
{#snippet sentMeta()}<ChatMessageMetadata status="sent" />{/snippet}
{#snippet deliveredMeta()}<ChatMessageMetadata status="delivered" />{/snippet}
{#snippet readMeta()}<ChatMessageMetadata status="read" />{/snippet}
{#snippet errorMeta()}<ChatMessageMetadata status="error" />{/snippet}

<h3>System messages</h3>
<div class="chat-frame">
	<ChatMessageList>
		<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>
		<ChatMessage sender="assistant" avatar={naviAvatar}>
			<Markdown density="compact" children="Good morning!" />
		</ChatMessage>
		<ChatSystemMessage>Conversation started</ChatSystemMessage>
		<ChatMessage sender="user">
			<ChatMessageBubble>Hey Navi</ChatMessageBubble>
		</ChatMessage>
		<ChatSystemMessage variant="divider">Today</ChatSystemMessage>
		<ChatSystemMessage>Cindy shared a file</ChatSystemMessage>
	</ChatMessageList>
</div>

<h3>Density</h3>
<div class="chat-density-row">
	{#each ['compact', 'balanced', 'spacious'] as const as density (density)}
		<div class="chat-frame">
			<Text type="supporting">{density}</Text>
			<ChatMessageList {density}>
				<ChatMessage sender="user">
					<ChatMessageBubble>How does the density system work?</ChatMessageBubble>
				</ChatMessage>
				<!-- Upstream sizes the avatar per density: `sm` for compact, `md` otherwise. -->
				<ChatMessage sender="assistant" avatar={density === 'compact' ? naviSmall : naviAvatar}>
					<Markdown density="compact" children={densityBody(density)} />
				</ChatMessage>
				<ChatMessage sender="user">
					<ChatMessageBubble>Makes sense, thanks!</ChatMessageBubble>
				</ChatMessage>
			</ChatMessageList>
		</div>
	{/each}
</div>

<h3>ChatTokenizedText</h3>
<div class="field-column">
	<!--
		`children` is typed `string` on both sides — upstream's prop is `string`,
		not `ReactNode` — so it is passed as an attribute rather than as markup:
		content between the tags would be a `Snippet`.
	-->
	<ChatTokenizedText tokens={mentionTokens} children="Hey @cindy, can @navi help with this?" />
	<ChatTokenizedText tokens={mentionTokens} children="@cindy at the start, and at the end @navi" />
	<ChatTokenizedText tokens={mentionTokens} children="Plain text with no tokens in it at all." />
</div>

<h3>ChatToolCalls</h3>
<div class="field-column">
	<ChatToolCalls calls={singleCall} />
	<ChatToolCalls calls={multipleCalls} />
	<ChatToolCalls calls={withStats} />
	<ChatToolCalls calls={allStatuses} />
</div>

<h3>ChatComposer</h3>
<div class="field-column">
	<!--
		`value` is a plain controlled prop, not `$bindable` — upstream pairs
		`value`/`onChange` and the port keeps that pairing.
	-->
	<ChatComposer
		value={simplestValue}
		onChange={(value) => (simplestValue = value)}
		onSubmit={(value) => (submitted = [...submitted, value])}
		placeholder="Type a message..."
	/>

	<ChatComposer
		onSubmit={(value) => (submitted = [...submitted, value])}
		isStopShown={isStreaming}
		onStop={() => (isStreaming = false)}
		footerActions={streamToggle}
		sendActions={dictationButton}
		drawer={attachmentDrawer}
		status={{ type: 'warning', message: 'Context window is 90% full.' }}
		input={triggerInput}
	/>

	{#if submitted.length > 0}
		<Text type="supporting">Submitted: {submitted.join(' · ')}</Text>
	{/if}
</div>

{#snippet streamToggle()}
	<Button
		label={isStreaming ? 'Stop streaming' : 'Simulate streaming'}
		variant="ghost"
		size="md"
		onclick={() => (isStreaming = !isStreaming)}
	/>
{/snippet}

{#snippet dictationButton()}
	<ChatDictationButton {dictation} isHiddenWhenUnsupported={false} />
{/snippet}

{#snippet attachmentDrawer()}
	<ChatComposerDrawer count={2} label="Attachments">
		<Text type="supporting">notes.md</Text>
		<Text type="supporting">screenshot.png</Text>
	</ChatComposerDrawer>
{/snippet}

{#snippet triggerInput()}
	<ChatComposerInput {triggers} placeholder="Try @ or /" />
{/snippet}

<h3>ChatLayout</h3>
<div class="chat-layout-frame">
	<ChatLayout composer={layoutComposer}>
		<ChatMessageList>
			<ChatMessage sender="user">
				<ChatMessageBubble>Does the dock stay put when the list scrolls?</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="assistant" avatar={naviAvatar}>
				<ChatMessageBubble
					>It does — the composer is docked and the messages scroll behind it.</ChatMessageBubble
				>
			</ChatMessage>
			{#each Array.from({ length: 8 }, (_, i) => i) as i (i)}
				<ChatMessage sender="user">
					<ChatMessageBubble>Filler message {i + 1}</ChatMessageBubble>
				</ChatMessage>
			{/each}
		</ChatMessageList>
	</ChatLayout>
</div>

{#snippet layoutComposer()}
	<ChatComposer onSubmit={() => {}} placeholder="Docked composer" />
{/snippet}

<style>
	.chat-frame {
		display: flex;
		flex-direction: column;
		max-width: 640px;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-element);
	}

	.chat-density-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-4);
	}

	.chat-layout-frame {
		display: flex;
		flex-direction: column;
		height: 420px;
		max-width: 640px;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-element);
		overflow: hidden;
	}
</style>
