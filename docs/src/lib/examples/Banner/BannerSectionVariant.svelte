<!--
	Ported from upstream's `templates/blocks/components/Banner/BannerSectionVariant.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Banner, Button, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3}>
	<Banner
		status="warning"
		title="Scheduled downtime"
		description="All services will be unavailable on Sunday from 2:00–4:00 AM."
		container="section"
		isDismissable
	/>
	<Banner
		status="info"
		title="Welcome to the new dashboard"
		description="We have redesigned the layout based on your feedback."
		container="section"
	>
		{#snippet endContent()}<Button label="Take a tour" variant="secondary" size="sm" />{/snippet}
	</Banner>
</Stack>
