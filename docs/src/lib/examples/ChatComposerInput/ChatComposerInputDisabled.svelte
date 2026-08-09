<!--
	Ported from upstream's `templates/blocks/components/ChatComposerInput/ChatComposerInputDisabled.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatComposer, ChatComposerInput, Stack } from '@astryx-svelte/core';
</script>

{#snippet input()}
	<ChatComposerInput isDisabled placeholder="Input is disabled" />
{/snippet}

<Stack direction="vertical" style="width: 450px; max-width: 100%">
	<ChatComposer onSubmit={() => {}} isDisabled {input} />
</Stack>
