<!--
	Ported from upstream's `templates/blocks/components/Token/TokenClickable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Token } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Click a token to view details</Text>
	<Stack direction="horizontal" gap={2} wrap="wrap">
		<Token label="Bug" color="red" onclick={() => {}} />
		<Token label="Feature" color="blue" onclick={() => {}} />
		<Token label="Enhancement" color="green" onclick={() => {}} />
		<Token label="Documentation" color="gray" onclick={() => {}} />
	</Stack>
</Stack>
