<!--
	Ported from upstream's `templates/blocks/components/Code/CodeAcrossTextSizes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Code, Heading, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={3}>
	<Heading level={3}>Heading with <Code>inline code</Code></Heading>
	<Text type="body">Body text with <Code>inline code</Code></Text>
	<Text type="supporting">Supporting text with <Code>inline code</Code></Text>
	<Text type="label">Label text with <Code>inline code</Code></Text>
</VStack>
