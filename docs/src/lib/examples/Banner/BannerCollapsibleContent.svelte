<!--
	Ported from upstream's `templates/blocks/components/Banner/BannerCollapsibleContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Banner, Button, List, ListItem, Stack, Text } from '@astryx-svelte/core';
</script>

<Banner
	status="warning"
	title="Configuration changes detected"
	description="Review the changes before they take effect."
	isDismissable
	defaultIsExpanded
>
	{#snippet endContent()}<Button label="Review" variant="secondary" size="sm" />{/snippet}
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">Changed settings:</Text>
		<List density="compact">
			<ListItem label="Authentication method updated" />
			<ListItem label="Rate limits modified" />
		</List>
	</Stack>
</Banner>
