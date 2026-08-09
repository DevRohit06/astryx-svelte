<!--
	Ported from upstream's `templates/blocks/components/Divider/DividerShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Divider, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4} style="width: 500px">
	<Divider variant="subtle" />
	<Divider variant="strong" />
	<Divider label="or" />
</Stack>
