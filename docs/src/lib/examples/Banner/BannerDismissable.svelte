<!--
	Ported from upstream's `templates/blocks/components/Banner/BannerDismissable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Banner, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3}>
	<Banner
		status="success"
		title="Deployment complete"
		description="Version 3.2.0 is now live in production."
		isDismissable
	/>
	<Banner
		status="warning"
		title="Scheduled maintenance tonight"
		description="The system will be briefly unavailable from 2:00–3:00 AM."
		isDismissable
	/>
	<Banner
		status="info"
		title="New feature available"
		description="Try the new dashboard layout in Settings."
		isDismissable
	/>
</Stack>
