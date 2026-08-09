<!--
	Ported from upstream's `templates/blocks/components/SyntaxTheme/SyntaxThemeDarkPreset.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock, SyntaxTheme } from '@astryx-svelte/core';
	import { dracula } from '@astryx-svelte/core/theme/syntax';

	const code = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;
</script>

<SyntaxTheme theme={dracula}>
	<CodeBlock {code} language="tsx" title="Dracula preset" />
</SyntaxTheme>
