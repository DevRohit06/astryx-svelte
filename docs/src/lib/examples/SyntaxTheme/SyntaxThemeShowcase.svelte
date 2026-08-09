<!--
	Ported from upstream's `templates/blocks/components/SyntaxTheme/SyntaxThemeShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CodeBlock, Stack, SyntaxTheme, Text } from '@astryx-svelte/core';
	import { oneDarkPro } from '@astryx-svelte/core/theme/syntax';

	const sampleCode = `async function save() {
  await api.update(values);
  toast.show('Saved');
}`;
</script>

<SyntaxTheme theme={oneDarkPro}>
	<Stack direction="vertical" gap={2} style="width: 360px; max-width: 100%">
		<Text type="supporting" weight="bold" color="secondary">One Dark Pro preset</Text>
		<CodeBlock code={sampleCode} language="tsx" />
	</Stack>
</SyntaxTheme>
