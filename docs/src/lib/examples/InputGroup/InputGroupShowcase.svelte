<!--
	Ported from upstream's `templates/blocks/components/InputGroup/InputGroupShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { InputGroup, InputGroupText, Stack, TextInput } from '@astryx-svelte/core';

	let price = $state('');
	let url = $state('');
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<InputGroup label="Price">
		<InputGroupText>$</InputGroupText>
		<TextInput
			label="Amount"
			isLabelHidden
			value={price}
			onChange={(next) => (price = next)}
			placeholder="0.00"
		/>
	</InputGroup>
	<InputGroup label="Website">
		<InputGroupText>https://</InputGroupText>
		<TextInput
			label="URL"
			isLabelHidden
			value={url}
			onChange={(next) => (url = next)}
			placeholder="example"
		/>
		<InputGroupText>.com</InputGroupText>
	</InputGroup>
</Stack>
