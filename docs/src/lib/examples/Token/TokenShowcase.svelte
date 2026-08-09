<!--
	Ported from upstream's `templates/blocks/components/Token/TokenShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Token } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `TagIcon`; the registry has no tag glyph, so this
	 * substitutes a built-in — the same substitution the demo routes make,
	 * retiring with the icon registry (TODO.md).
	 */
</script>

<Stack direction="horizontal" gap={2} vAlign="center">
	<Token label="Default" />
	<Token label="Removable" color="blue" onRemove={() => {}} />
	<Token label="Design" color="purple">
		{#snippet icon()}<Icon icon="funnel" size="sm" color="inherit" />{/snippet}
	</Token>
</Stack>
