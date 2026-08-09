<!--
	Ported from upstream's `templates/blocks/components/Banner/BannerWithActionButton.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Banner, Button, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3}>
	<Banner
		status="info"
		title="Your trial expires in 3 days"
		description="Upgrade now to keep access to all features."
	>
		{#snippet endContent()}<Button label="Upgrade" variant="secondary" size="sm" />{/snippet}
	</Banner>
	<Banner
		status="warning"
		title="API key expires soon"
		description="Generate a new key before December 1 to avoid service interruption."
	>
		{#snippet endContent()}<Button label="Renew key" variant="secondary" size="sm" />{/snippet}
	</Banner>
	<Banner
		status="error"
		title="Payment failed"
		description="We could not process your last payment."
	>
		{#snippet endContent()}<Button label="Retry" variant="secondary" size="sm" />{/snippet}
	</Banner>
</Stack>
