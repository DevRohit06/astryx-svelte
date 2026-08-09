<!--
	Ported from upstream's `templates/blocks/components/ButtonGroup/ButtonGroupFloating.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ButtonGroup, Button, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={3} hAlign="start">
	<Text type="supporting" color="secondary">
		The whole group shares one raised surface — a floating action bar
	</Text>
	<ButtonGroup label="Zoom controls" elevation="med">
		<Button label="Zoom out" />
		<Button label="Reset" />
		<Button label="Zoom in" />
	</ButtonGroup>
</Stack>
