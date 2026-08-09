<!--
	Ported from upstream's `templates/blocks/components/Banner/BannerStatuses.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Banner, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3}>
	<Banner
		status="info"
		title="A new software update is available"
		description="Version 2.4.1 includes performance improvements and bug fixes."
	/>
	<Banner
		status="success"
		title="Changes saved"
		description="Your profile information has been updated successfully."
	/>
	<Banner
		status="warning"
		title="Storage almost full"
		description="You have used 90% of your available storage."
	/>
	<Banner
		status="error"
		title="Build failed"
		description="3 tests did not pass. Check the logs for details."
	/>
</Stack>
