<!--
	Ported from upstream's `templates/blocks/components/Code/CodeShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Code, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3}>
	<Text type="body">
		Run <Code>npm install @astryx-svelte/core</Code> to add the package.
	</Text>
	<Text type="body">
		Use the <Code>variant</Code> prop to switch between <Code>primary</Code>,
		<Code>secondary</Code>, and <Code>ghost</Code> styles.
	</Text>
</Stack>
