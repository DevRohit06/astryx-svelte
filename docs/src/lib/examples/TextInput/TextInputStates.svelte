<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, TextInput } from '@astryx-svelte/core';

	let error = $state('sarah@');
	let warning = $state('sarah_chen');
	let success = $state('https://sarahchen.dev');
	let errorOnly = $state('test');
</script>

<div style="width: 300px">
	<Stack direction="vertical" gap={3}>
		<TextInput
			label="Error message"
			value={error}
			onChange={(next) => (error = next)}
			placeholder="Enter a value"
			status={{ type: 'error', message: 'Please enter a valid email address.' }}
		/>
		<TextInput
			label="Warning message"
			value={warning}
			onChange={(next) => (warning = next)}
			placeholder="Enter a value"
			status={{
				type: 'warning',
				message: 'This username is already taken — try adding a number.'
			}}
		/>
		<TextInput
			label="Success message"
			value={success}
			onChange={(next) => (success = next)}
			placeholder="Enter a value"
			status={{ type: 'success', message: 'URL is valid and reachable.' }}
		/>
		<TextInput
			label="Status without message"
			value={errorOnly}
			onChange={(next) => (errorOnly = next)}
			placeholder="Enter a value"
			status={{ type: 'error' }}
		/>
		<TextInput
			label="Disabled field"
			value=""
			onChange={() => {}}
			placeholder="Enter a value"
			isDisabled
		/>
		<TextInput label="Loading field" value="sarahc" onChange={() => {}} isLoading />
	</Stack>
</div>
