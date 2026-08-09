<!--
	Ported from upstream's `templates/blocks/components/ProgressBar/ProgressBarCustomFormat.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ProgressBar, Text, VStack } from '@astryx-svelte/core';
</script>

<div style="width: 300px">
	<VStack gap={1}>
		<ProgressBar
			value={3.2}
			max={5}
			label="Disk usage"
			hasValueLabel
			formatValueLabel={(value: number, max: number) => `${value} GB / ${max} GB`}
		/>
		<Text type="supporting" color="secondary">1.8 GB remaining</Text>
	</VStack>
</div>
