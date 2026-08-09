<!--
	Ported from upstream's `templates/blocks/components/Text/TextShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={2}>
	<Text type="body">Body: The bulk of content</Text>
	<Text type="large">Large: Emphasized content</Text>
	<Text type="label">Label: Form and chart labels</Text>
	<Text type="supporting">Supporting: Helper text</Text>
	<Text type="code">Code: const x = 42;</Text>
</Stack>
