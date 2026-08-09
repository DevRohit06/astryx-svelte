<!--
	Ported from upstream's `templates/blocks/components/Tooltip/TooltipActionBarTooltips.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Center, HStack, Tooltip } from '@astryx-svelte/core';
</script>

<Center>
	<HStack gap={4}>
		<Tooltip content="Save your changes" placement="above">
			<Button label="Save" />
		</Tooltip>
		<Tooltip content="Discard changes" placement="above">
			<Button label="Cancel" />
		</Tooltip>
		<Tooltip content="Delete permanently" placement="above">
			<Button label="Delete" variant="destructive" />
		</Tooltip>
	</HStack>
</Center>
