<!--
	Ported from upstream's `templates/blocks/components/ProgressBar/ProgressBarSemanticVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ProgressBar, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={4} width="100%" style="max-width: 300px">
	<ProgressBar value={60} label="Accent" variant="accent" hasValueLabel />
	<ProgressBar value={80} label="Positive" variant="success" hasValueLabel />
	<ProgressBar value={50} label="Warning" variant="warning" hasValueLabel />
	<ProgressBar value={92} label="Negative" variant="error" hasValueLabel />
	<ProgressBar value={35} label="Neutral" variant="neutral" hasValueLabel />
</VStack>
