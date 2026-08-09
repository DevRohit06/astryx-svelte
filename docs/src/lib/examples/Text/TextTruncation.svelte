<!--
	Ported from upstream's `templates/blocks/components/Text/TextTruncation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Text } from '@astryx-svelte/core';

	const LONG_TEXT =
		'The design system provides a consistent set of typography tokens, spacing scales, and color palettes that ensure every surface in the product feels cohesive regardless of which team built it.';

	const LINES = [
		{ maxLines: 1, label: '1 line' },
		{ maxLines: 2, label: '2 lines' },
		{ maxLines: 3, label: '3 lines' }
	];
</script>

<div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px">
	{#each LINES as entry (entry.maxLines)}
		<div>
			<Text type="supporting" color="secondary" display="block">{entry.label}</Text>
			<div style="border: 1px solid #ccc; padding: 8px">
				<Text type="body" maxLines={entry.maxLines}>{LONG_TEXT}</Text>
			</div>
		</div>
	{/each}
</div>
