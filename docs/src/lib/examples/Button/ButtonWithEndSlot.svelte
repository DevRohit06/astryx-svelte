<!--
	Ported from upstream's `templates/blocks/components/Button/ButtonWithEndSlot.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Button, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes `label={3}` and `label={12}` — numbers, which its
	 * `ReactNode` type accepts. `Badge.label` is `string | Snippet` here, so the
	 * counts are written as strings; the rendered output is identical (port/todo.md
	 * records the divergence).
	 */
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Trailing badges for counts or status</Text>
	<Stack direction="horizontal" gap={3} vAlign="center">
		<Button label="Messages" variant="primary">
			{#snippet endContent()}<Badge variant="info" label="3" />{/snippet}
		</Button>
		<Button label="Notifications" variant="secondary">
			{#snippet endContent()}<Badge variant="warning" label="12" />{/snippet}
		</Button>
		<Button label="Updates" variant="ghost">
			{#snippet endContent()}<Badge variant="neutral" label="New" />{/snippet}
		</Button>
	</Stack>
</Stack>
