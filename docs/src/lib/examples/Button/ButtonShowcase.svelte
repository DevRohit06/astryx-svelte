<!--
	Ported from upstream's `templates/blocks/components/Button/ButtonShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="horizontal" gap={3} vAlign="center">
	<Button label="Primary" variant="primary" />
	<Button label="Secondary" variant="secondary" />
	<Button label="Ghost" variant="ghost" />
	<Button label="Destructive" variant="destructive" />
</Stack>
