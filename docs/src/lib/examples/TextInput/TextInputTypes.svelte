<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputTypes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, TextInput } from '@astryx-svelte/core';

	let password = $state('hunter42');
	let email = $state('sarah@example.com');
	let tooltip = $state('');
	let required = $state('');
	let optional = $state('');
	let described = $state('');
</script>

<div style="width: 300px">
	<Stack direction="vertical" gap={3}>
		<TextInput
			label="Default field"
			value={described}
			onChange={(next) => (described = next)}
			placeholder="Enter your email"
			description="Descriptions can be used to provide additional information about a field."
		/>
		<TextInput
			type="password"
			label="Password field"
			value={password}
			onChange={(next) => (password = next)}
			placeholder="Enter a value"
		/>
		<TextInput
			type="email"
			label="Email field"
			value={email}
			onChange={(next) => (email = next)}
			placeholder="Enter a value"
		/>
		<TextInput
			label="Field tooltip"
			value={tooltip}
			onChange={(next) => (tooltip = next)}
			placeholder="Enter your API key"
			labelTooltip="Your unique API key for authentication. Keep this secret!"
		/>
		<TextInput
			label="Required field"
			value={required}
			onChange={(next) => (required = next)}
			placeholder="Enter your username"
			isRequired
		/>
		<TextInput
			label="Optional field"
			value={optional}
			onChange={(next) => (optional = next)}
			placeholder="Enter your nickname"
			isOptional
		/>
	</Stack>
</div>
