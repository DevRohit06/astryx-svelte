<!--
	Ported from upstream's `templates/blocks/components/HoverCard/HoverCardShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Button, Heading, HoverCard, Stack, Text } from '@astryx-svelte/core';
</script>

<HoverCard placement="above">
	{#snippet content()}
		<Stack direction="vertical" gap={2} style="width: 240px">
			<Stack direction="horizontal" gap={2} vAlign="center">
				<Avatar name="Jane Doe" size="lg" />
				<Stack direction="vertical" gap={0}>
					<Heading level={5}>Jane Doe</Heading>
					<Text type="supporting" color="secondary">Software Engineer</Text>
				</Stack>
			</Stack>
			<Text type="body" color="secondary">Building great products with great people.</Text>
		</Stack>
	{/snippet}
	<Button label="@janedoe" variant="ghost" />
</HoverCard>
