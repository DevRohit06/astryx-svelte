<!--
	Ported from upstream's `templates/blocks/components/Field/FieldRequired.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, TextInput, VStack } from '@astryx-svelte/core';

	let username = $state('');
	let email = $state('');
</script>

<Center>
	<VStack gap={4}>
		<TextInput
			label="Username"
			isRequired
			value={username}
			onChange={(next) => (username = next)}
			placeholder="Enter your username"
		/>
		<TextInput
			label="Backup email"
			isOptional
			value={email}
			onChange={(next) => (email = next)}
			placeholder="you@example.com"
		/>
	</VStack>
</Center>
