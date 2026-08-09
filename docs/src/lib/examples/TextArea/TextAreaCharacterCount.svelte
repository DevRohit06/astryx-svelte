<!--
	Ported from upstream's `templates/blocks/components/TextArea/TextAreaCharacterCount.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TextArea } from '@astryx-svelte/core';

	let value = $state(
		'Excited to announce that our team just shipped the new dashboard! Check it out and let us know what you think.'
	);
</script>

<div style="width: 400px">
	<TextArea
		label="Status update"
		{value}
		onChange={(next) => (value = next)}
		placeholder="What's on your mind?"
		maxLength={280}
		rows={3}
	/>
</div>
