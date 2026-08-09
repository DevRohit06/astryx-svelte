<!--
	Ported from upstream's `templates/blocks/components/Field/FieldShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Field, Stack, TextInput } from '@astryx-svelte/core';

	let email = $state('');

	const status = $derived(
		email.length > 0 && !email.includes('@')
			? ({ type: 'error', message: 'Enter a valid email address.' } as const)
			: undefined
	);
</script>

<Stack direction="vertical" gap={3} style="width: 320px">
	<Field
		label="Email"
		inputID="field-email"
		description="We will never share your email."
		isRequired
		{status}
	>
		<TextInput
			label="Email"
			isLabelHidden
			value={email}
			onChange={(next) => (email = next)}
			placeholder="you@example.com"
		/>
	</Field>
</Stack>
