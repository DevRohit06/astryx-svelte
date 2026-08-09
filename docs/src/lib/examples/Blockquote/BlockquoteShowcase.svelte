<!--
	Ported from upstream's `templates/blocks/components/Blockquote/BlockquoteShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`cite` is a `ReactNode` upstream, so the second quote passes the string
	`"Steve Jobs"`; here it is a `Snippet`, which is the same value expressed in
	Svelte's type system rather than a change to the example.
-->
<script lang="ts">
	import { Blockquote, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4} style="width: 500px">
	<Blockquote>
		Design is not just what it looks like and feels like. Design is how it works.
	</Blockquote>
	<Blockquote>
		{#snippet cite()}Steve Jobs{/snippet}
		The people who are crazy enough to think they can change the world are the ones who do.
	</Blockquote>
</Stack>
