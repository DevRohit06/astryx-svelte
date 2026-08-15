<!--
	Ported from upstream's `templates/blocks/components/Token/TokenEndContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Stack, Text, Token } from '@astryx-svelte/core';

	/**
	 * Upstream passes `label={12}` and `label={3}` — numbers, which its
	 * `ReactNode` type accepts. `Badge.label` is `string | Snippet` here, so the
	 * counts are written as strings; the rendered output is identical (port/todo.md
	 * records the divergence).
	 */
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Trailing badges for counts or status</Text>
	<Stack direction="horizontal" gap={2} wrap="wrap">
		<Token label="Inbox" color="blue">
			{#snippet endContent()}<Badge variant="info" label="12" />{/snippet}
		</Token>
		<Token label="Reviews" color="purple">
			{#snippet endContent()}<Badge variant="purple" label="3" />{/snippet}
		</Token>
		<Token label="Resolved" color="green">
			{#snippet endContent()}<Badge variant="success" label="Done" />{/snippet}
		</Token>
	</Stack>
</Stack>
