<!--
	Ported from upstream's `templates/blocks/components/ChatComposerInput/ChatComposerInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`ChatComposer.input` is a `Snippet` where upstream types it `ReactNode`, so
	the element it writes inline becomes one.
-->
<script lang="ts">
	import { ChatComposer, ChatComposerInput, Stack } from '@astryx-svelte/core';
</script>

{#snippet input()}
	<ChatComposerInput placeholder="Ask me anything about Astryx..." />
{/snippet}

<Stack direction="vertical" style="width: 450px; max-width: 100%">
	<ChatComposer onSubmit={() => {}} {input} />
</Stack>
