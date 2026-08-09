<!--
	Ported from upstream's `templates/blocks/components/Button/ButtonWithIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Icon, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Plus`/`PencilSquare`/`ArrowDownTray`/`Trash`;
	 * the registry ships none of the four, so this substitutes built-ins — the
	 * same substitution the demo routes make, retiring with the icon registry
	 * (TODO.md).
	 */
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Icons reinforce the action</Text>
	<Stack direction="horizontal" gap={3} vAlign="center">
		<Button label="New item" variant="primary">
			{#snippet icon()}<Icon icon="check" />{/snippet}
		</Button>
		<Button label="Edit" variant="secondary">
			{#snippet icon()}<Icon icon="wrench" />{/snippet}
		</Button>
		<Button label="Download" variant="ghost">
			{#snippet icon()}<Icon icon="arrowDown" />{/snippet}
		</Button>
		<Button label="Delete" variant="destructive">
			{#snippet icon()}<Icon icon="close" />{/snippet}
		</Button>
	</Stack>
</Stack>
