<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerAttachments.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatComposer, ChatComposerDrawer, Stack, Token } from '@astryx-svelte/core';
</script>

{#snippet drawer()}
	<ChatComposerDrawer count={6}>
		<Token label="feature-prd.docx" onRemove={() => {}} />
		<Token label="2026-roadmap.pdf" onRemove={() => {}} />
		<Token label="user-flow.fig" onRemove={() => {}} />
		<Token label="launch-plan.docx" onRemove={() => {}} />
		<Token label="user-feedback.csv" onRemove={() => {}} />
		<Token label="analytics-kpis.csv" onRemove={() => {}} />
	</ChatComposerDrawer>
{/snippet}

<Stack direction="vertical" style="width: 100%; max-width: 450px">
	<ChatComposer
		onSubmit={(value) => {
			console.log('Sent:', value);
		}}
		{drawer}
	/>
</Stack>
