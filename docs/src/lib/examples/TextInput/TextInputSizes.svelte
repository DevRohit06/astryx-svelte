<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputSizes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, TextInput } from '@astryx-svelte/core';

	let sm = $state('');
	let md = $state('');
	let lg = $state('');
</script>

<div style="width: 300px">
	<Stack direction="vertical" gap={3}>
		<TextInput
			label="Small"
			value={sm}
			onChange={(next) => (sm = next)}
			placeholder="Enter a value"
			size="sm"
		/>
		<TextInput
			label="Medium"
			value={md}
			onChange={(next) => (md = next)}
			placeholder="Enter a value"
			size="md"
		/>
		<TextInput
			label="Large"
			value={lg}
			onChange={(next) => (lg = next)}
			placeholder="Enter a value"
			size="lg"
		/>
	</Stack>
</div>
