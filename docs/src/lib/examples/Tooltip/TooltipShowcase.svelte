<!--
	Ported from upstream's `templates/blocks/components/Tooltip/TooltipShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Tooltip } from '@astryx-svelte/core';
</script>

<Tooltip content="This is a helpful tooltip" placement="above">
	<Button label="Hover me" />
</Tooltip>
