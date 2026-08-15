<!--
	Ported from upstream's `templates/blocks/components/ChatComposerDrawer/ChatComposerDrawerWithProgress.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `AtSymbolIcon` → `info`, `PaperClipIcon` → `copy`.
	Stand-ins rather than true matches, the same ones the AppShell blocks make.
	Retires with the icon registry (port/todo.md). React's fragment around the two
	header buttons needs no counterpart — a snippet body is already one.
-->
<script lang="ts">
	import {
		Button,
		ChatComposer,
		ChatComposerDrawer,
		Icon,
		ProgressBar,
		Stack,
		Token
	} from '@astryx-svelte/core';
</script>

{#snippet atSymbolIcon()}<Icon icon="info" size="sm" />{/snippet}
{#snippet paperClipIcon()}<Icon icon="copy" size="sm" />{/snippet}

{#snippet drawer()}
	<ChatComposerDrawer count={3} label="Attachments">
		<Token label="design-spec.pdf" onRemove={() => {}} />
		<Token label="api-schema.json" onRemove={() => {}} />
		<Token label="screenshot.png" onRemove={() => {}} />
	</ChatComposerDrawer>
{/snippet}

{#snippet headerActions()}
	<Button
		label="Mention"
		variant="ghost"
		size="sm"
		icon={atSymbolIcon}
		isIconOnly
		onclick={() => {}}
	/>
	<Button
		label="Attach"
		variant="ghost"
		size="sm"
		icon={paperClipIcon}
		isIconOnly
		onclick={() => {}}
	/>
{/snippet}

{#snippet headerContext()}
	<Stack direction="horizontal" gap={2} vAlign="center">
		<ProgressBar value={42} label="Context usage" isLabelHidden />
	</Stack>
{/snippet}

<Stack direction="vertical" gap={4} width={480}>
	<ChatComposer onSubmit={() => {}} {drawer} {headerActions} {headerContext} />
</Stack>
