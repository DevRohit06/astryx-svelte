<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerFullFeatured.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `AtSymbolIcon` → `info`, `PaperClipIcon` → `copy`,
	`SparklesIcon` and `Cog6ToothIcon` → `wrench`, `MicrophoneIcon` →
	`microphone`, which is exact. Stand-ins rather than true matches, the same
	ones the AppShell blocks make. Retires with the icon registry (port/todo.md).

	React's fragments around the paired header and footer actions need no
	counterpart — a snippet body is already one.
-->
<script lang="ts">
	import {
		Button,
		ChatComposer,
		ChatComposerDrawer,
		ChatComposerInput,
		DropdownMenu,
		Icon,
		ProgressBar,
		Stack,
		Text,
		Token
	} from '@astryx-svelte/core';

	let isStreaming = $state(false);
</script>

{#snippet atSymbolIcon()}<Icon icon="info" />{/snippet}
{#snippet paperClipIcon()}<Icon icon="copy" />{/snippet}
{#snippet sparklesIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet settingsIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet microphoneIcon()}<Icon icon="microphone" />{/snippet}
{#snippet autoLabel()}Auto{/snippet}
{#snippet settingsLabel()}Settings{/snippet}

{#snippet input()}
	<ChatComposerInput style="min-height: 44px" />
{/snippet}

{#snippet drawer()}
	<ChatComposerDrawer count={5}>
		<Token label="design-spec.pdf" onRemove={() => {}} />
		<Token label="requirements.docx" onRemove={() => {}} />
		<Token label="wireframes.fig" onRemove={() => {}} />
		<Token label="api-spec.yaml" onRemove={() => {}} />
		<Token label="user-research.csv" onRemove={() => {}} />
	</ChatComposerDrawer>
{/snippet}

{#snippet headerActions()}
	<Button label="Mention" variant="ghost" size="sm" icon={atSymbolIcon} isIconOnly />
	<Button label="Attach file" variant="ghost" size="sm" icon={paperClipIcon} isIconOnly />
{/snippet}

{#snippet headerContext()}
	<ProgressBar label="Context window" value={50} isLabelHidden />
{/snippet}

{#snippet footerActions()}
	<DropdownMenu
		button={{
			label: 'Auto',
			variant: 'ghost',
			size: 'md',
			icon: sparklesIcon,
			children: autoLabel
		}}
		menuWidth={200}
		items={[
			{ label: 'Auto', onClick: () => {} },
			{ label: 'Model A', onClick: () => {} },
			{ label: 'Model B', onClick: () => {} },
			{ label: 'Model C', onClick: () => {} }
		]}
	/>
	<DropdownMenu
		button={{
			label: 'Settings',
			variant: 'ghost',
			size: 'md',
			icon: settingsIcon,
			children: settingsLabel
		}}
		menuWidth={200}
		items={[
			{ label: 'Preferences', onClick: () => {} },
			{ label: 'Keyboard shortcuts', onClick: () => {} },
			{ label: 'About', onClick: () => {} }
		]}
	/>
{/snippet}

{#snippet sendActions()}
	<Button label="Microphone" variant="ghost" size="md" icon={microphoneIcon} isIconOnly />
{/snippet}

<Stack direction="vertical" gap={4} style="width: 100%; max-width: 450px">
	<Text type="supporting" color="secondary">All slots populated</Text>
	<ChatComposer
		onSubmit={(value) => {
			console.log('Sent:', value);
			isStreaming = true;
			setTimeout(() => (isStreaming = false), 3000);
		}}
		isStopShown={isStreaming}
		onStop={() => (isStreaming = false)}
		placeholder="Ask me anything..."
		{input}
		{drawer}
		{headerActions}
		{headerContext}
		{footerActions}
		{sendActions}
	/>
</Stack>
