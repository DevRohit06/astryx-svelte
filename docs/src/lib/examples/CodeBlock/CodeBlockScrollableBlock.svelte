<!--
	Ported from upstream's `templates/blocks/components/CodeBlock/CodeBlockScrollableBlock.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock } from '@astryx-svelte/core';

	const code = Array.from({ length: 50 }, (_, i) => `const line${i + 1} = ${i + 1};`).join('\n');
</script>

<CodeBlock {code} language="typescript" title="many-lines.ts" hasLineNumbers maxHeight={280} />
