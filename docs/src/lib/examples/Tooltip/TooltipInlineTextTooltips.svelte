<!--
	Ported from upstream's `templates/blocks/components/Tooltip/TooltipInlineTextTooltips.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Text, Tooltip } from '@astryx-svelte/core';
</script>

<Text type="body">
	Learn more about our <Tooltip content="Your data is encrypted and never shared" placement="above"
		>privacy policy</Tooltip
	> and <Tooltip content="Standard 30-day agreement" placement="above">terms of service</Tooltip>.
</Text>
