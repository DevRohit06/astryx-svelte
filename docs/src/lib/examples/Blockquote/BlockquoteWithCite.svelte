<!--
	Ported from upstream's `templates/blocks/components/Blockquote/BlockquoteWithCite.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Blockquote, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={4} style="max-width: 500px">
	<Blockquote>
		Design is not just what it looks like and feels like. Design is how it works.
	</Blockquote>
	<Blockquote>
		{#snippet cite()}Steve Jobs{/snippet}
		The people who are crazy enough to think they can change the world are the ones who do.
	</Blockquote>
</VStack>
