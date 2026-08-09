<!--
	Ported from upstream's `templates/blocks/components/InputGroup/InputGroupBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { InputGroup, InputGroupText, TextInput } from '@astryx-svelte/core';

	let price = $state('');
</script>

<div style="width: 320px">
	<InputGroup label="Price">
		<InputGroupText>$</InputGroupText>
		<TextInput
			label="Amount"
			isLabelHidden
			value={price}
			onChange={(next) => (price = next)}
			placeholder="0.00"
		/>
		<InputGroupText>USD</InputGroupText>
	</InputGroup>
</div>
