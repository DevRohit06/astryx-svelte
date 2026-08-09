<!--
	Ported from upstream's `templates/blocks/components/Center/CenterInsideACard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Center, Icon, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `InboxIcon`; the registry has no inbox glyph, so
	 * this substitutes a built-in — the same substitution the demo routes make,
	 * retiring with the icon registry (TODO.md).
	 */
</script>

<Card width={400}>
	<Center height={200}>
		<Stack direction="vertical" gap={2} hAlign="center">
			<Icon icon="info" size="lg" color="secondary" />
			<Text type="body" weight="bold">No messages yet</Text>
			<Text type="supporting" color="secondary">Messages from your team will appear here.</Text>
		</Stack>
	</Center>
</Card>
