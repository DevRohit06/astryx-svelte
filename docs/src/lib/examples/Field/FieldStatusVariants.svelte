<!--
	Ported from upstream's `templates/blocks/components/Field/FieldStatusVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, TextInput, VStack } from '@astryx-svelte/core';

	let email = $state('bad-email');
	let username = $state('admin');
	let apiKey = $state('sk-live-abc123');
</script>

<Center>
	<VStack gap={4}>
		<TextInput
			label="Email"
			description="Enter your work email"
			value={email}
			onChange={(next) => (email = next)}
			status={{ type: 'error', message: 'Please enter a valid email address' }}
		/>
		<TextInput
			label="Username"
			description="Choose a unique username"
			value={username}
			onChange={(next) => (username = next)}
			status={{ type: 'warning', message: 'This username is reserved for administrators' }}
		/>
		<TextInput
			label="API Key"
			description="Paste your API key"
			value={apiKey}
			onChange={(next) => (apiKey = next)}
			status={{ type: 'success', message: 'API key is valid and active' }}
		/>
	</VStack>
</Center>
