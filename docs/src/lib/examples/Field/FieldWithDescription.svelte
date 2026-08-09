<!--
	Ported from upstream's `templates/blocks/components/Field/FieldWithDescription.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, TextInput, VStack } from '@astryx-svelte/core';

	let email = $state('');
	let password = $state('');
</script>

<Center>
	<VStack gap={4}>
		<TextInput
			label="Email"
			description="We'll send a confirmation link to this address"
			value={email}
			onChange={(next) => (email = next)}
			placeholder="you@example.com"
		/>
		<TextInput
			label="Password"
			description="At least 8 characters with one uppercase letter"
			value={password}
			onChange={(next) => (password = next)}
			placeholder="Create a password"
		/>
	</VStack>
</Center>
