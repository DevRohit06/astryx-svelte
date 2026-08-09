<!--
	Ported from upstream's `templates/blocks/components/CodeBlock/CodeBlockBashCommand.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={4} style="width: 100%; max-width: 400px">
	<CodeBlock
		code="npm install @astryxdesign/core"
		language="bash"
		hasCopyButton
		style="width: 100%"
	/>
	<CodeBlock
		code="yarn add @astryxdesign/theme-neutral"
		language="bash"
		hasCopyButton
		style="width: 100%"
	/>
</VStack>
