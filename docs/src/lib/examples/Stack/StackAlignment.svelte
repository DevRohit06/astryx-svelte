<!--
	Ported from upstream's `templates/blocks/components/Stack/StackAlignment.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Two mechanical translations. Upstream's per-component subpaths
	(`@astryxdesign/core/Layout`, `/Card`, `/Button`, `/Text`) collapse to the
	root barrel, which is the only entry point this port publishes. And React's
	`style={{maxWidth: 500}}` — an object with an implied `px` — becomes the CSS
	string Svelte's `style` attribute takes.

	The three cards are upstream's, repeated rather than looped: the block exists
	to show `hAlign` taking `start` / `center` / `end` side by side, and a loop
	would hide the prop the example is about.
-->
<script lang="ts">
	import { Button, Card, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3} width="100%" style="max-width: 500px">
	<Card padding={4}>
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">Start (left)</Text>
			<Stack direction="horizontal" gap={1} hAlign="start">
				<Button label="Cancel" variant="secondary" size="sm" />
				<Button label="Save" variant="primary" size="sm" />
			</Stack>
		</Stack>
	</Card>
	<Card padding={4}>
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">Center</Text>
			<Stack direction="horizontal" gap={1} hAlign="center">
				<Button label="Cancel" variant="secondary" size="sm" />
				<Button label="Save" variant="primary" size="sm" />
			</Stack>
		</Stack>
	</Card>
	<Card padding={4}>
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">End (right)</Text>
			<Stack direction="horizontal" gap={1} hAlign="end">
				<Button label="Cancel" variant="secondary" size="sm" />
				<Button label="Save" variant="primary" size="sm" />
			</Stack>
		</Stack>
	</Card>
</Stack>
