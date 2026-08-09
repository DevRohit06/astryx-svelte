<!--
	Ported from upstream's `templates/blocks/components/ChatComposerDrawer/ChatComposerDrawerCollapsible.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatComposer, ChatComposerDrawer, Stack, Token } from '@astryx-svelte/core';
</script>

{#snippet drawer()}
	<ChatComposerDrawer count={6} label="Files">
		<Token label="design-spec.pdf" onRemove={() => {}} />
		<Token label="api-schema.json" onRemove={() => {}} />
		<Token label="screenshot.png" onRemove={() => {}} />
		<Token label="meeting-notes.md" onRemove={() => {}} />
		<Token label="test-results.csv" onRemove={() => {}} />
		<Token label="deploy-log.txt" onRemove={() => {}} />
	</ChatComposerDrawer>
{/snippet}

<Stack direction="vertical" gap={4} width={480}>
	<ChatComposer onSubmit={() => {}} {drawer} />
</Stack>
