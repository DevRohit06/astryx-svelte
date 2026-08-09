<!--
	Ported from upstream's `templates/blocks/components/FormLayout/FormLayoutHorizontal.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FormLayout, TextInput } from '@astryx-svelte/core';

	let first = $state('Jordan');
	let last = $state('Rivera');
</script>

<FormLayout direction="horizontal" style="width: 100%; max-width: 400px">
	<TextInput label="First Name" value={first} onChange={(next) => (first = next)} />
	<TextInput label="Last Name" value={last} onChange={(next) => (last = next)} />
</FormLayout>
