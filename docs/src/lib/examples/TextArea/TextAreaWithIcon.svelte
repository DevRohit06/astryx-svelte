<!--
	Ported from upstream's `templates/blocks/components/TextArea/TextAreaWithIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, TextArea } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `PencilSquareIcon`; the registry ships no pencil
	 * glyph, so this substitutes a built-in — the same substitution the demo routes
	 * make. Retires with the icon registry (TODO.md).
	 */

	let value = $state('');
</script>

{#snippet pencilIcon()}<Icon icon="info" size="sm" color="secondary" />{/snippet}

<div style="width: 400px">
	<TextArea
		label="Meeting notes"
		description="Capture key decisions and action items."
		{value}
		onChange={(next) => (value = next)}
		placeholder="What was discussed?"
		startIcon={pencilIcon}
	/>
</div>
