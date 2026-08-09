<!--
	Ported from upstream's `templates/blocks/components/Banner/BannerShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Banner, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3} style="max-width: 800px">
	<Banner status="info" title="A new software update is available." />
	<Banner status="success" title="Your changes have been saved." />
	<Banner
		status="warning"
		title="Your trial expires in 3 days."
		description="Upgrade to keep access to all features."
	/>
	<Banner
		status="error"
		title="Payment failed."
		description="Update your billing information to continue."
	/>
</Stack>
