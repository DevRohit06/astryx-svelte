<!--
	Ported from upstream's `templates/blocks/components/ButtonGroup/ButtonGroupShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, ButtonGroup, Icon, IconButton, Stack } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `ClipboardDocument`/`Scissors`/`Clipboard`; the
	 * registry ships `copy` and `checkDouble` but nothing for cut or paste, so
	 * this substitutes built-ins — the same substitution the demo routes make,
	 * retiring with the icon registry (TODO.md).
	 */
</script>

<Stack direction="horizontal" gap={6} vAlign="center">
	<ButtonGroup label="Clipboard actions">
		<Button label="Copy">
			{#snippet icon()}<Icon icon="copy" />{/snippet}
		</Button>
		<Button label="Cut">
			{#snippet icon()}<Icon icon="checkDouble" />{/snippet}
		</Button>
		<Button label="Paste">
			{#snippet icon()}<Icon icon="check" />{/snippet}
		</Button>
	</ButtonGroup>
	<ButtonGroup label="Save options">
		<Button label="Save" variant="primary" />
		<IconButton label="Save options" variant="primary">
			{#snippet icon()}<Icon icon="chevronDown" />{/snippet}
		</IconButton>
	</ButtonGroup>
</Stack>
