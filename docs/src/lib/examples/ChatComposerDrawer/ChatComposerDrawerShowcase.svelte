<!--
	Ported from upstream's `templates/blocks/components/ChatComposerDrawer/ChatComposerDrawerShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports a Heroicon here rather than inlining the SVG, so the icon is
	a registry substitution: `PaperClipIcon` → `copy`, the same stand-in
	`FolderIcon` takes in the AppShell blocks. Retires with the icon registry
	(TODO.md). Upstream's `drawerBorder` is a `CSSProperties` object; here it is a
	style string.
-->
<script lang="ts">
	import {
		Button,
		ChatComposer,
		ChatComposerDrawer,
		Icon,
		Stack,
		Token
	} from '@astryx-svelte/core';

	const drawerBorder =
		'border: var(--border-width) solid var(--color-border); border-radius: var(--radius-chat)';
</script>

{#snippet paperClipIcon()}<Icon icon="copy" size="sm" />{/snippet}

{#snippet drawer()}
	<ChatComposerDrawer count={4} label="Attachments" style={drawerBorder}>
		<Token label="design-spec.pdf" onRemove={() => {}} />
		<Token label="api-schema.json" onRemove={() => {}} />
		<Token label="screenshot.png" onRemove={() => {}} />
		<Token label="meeting-notes.md" onRemove={() => {}} />
	</ChatComposerDrawer>
{/snippet}

{#snippet headerActions()}
	<Button
		label="Attach"
		variant="ghost"
		size="sm"
		icon={paperClipIcon}
		isIconOnly
		onclick={() => {}}
	/>
{/snippet}

<Stack direction="vertical" gap={4} width={480}>
	<ChatComposer onSubmit={() => {}} {drawer} {headerActions} />
</Stack>
