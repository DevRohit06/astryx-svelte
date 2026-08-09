<!--
	Ported from upstream's `templates/blocks/components/FormLayout/FormLayoutNested.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FormLayout, TextInput } from '@astryx-svelte/core';

	let first = $state('Priya');
	let last = $state('Sharma');
	let email = $state('priya.sharma@example.com');
	let city = $state('San Francisco');
	// Upstream calls this `state` (the US address field). Renamed because a
	// binding named `state` shadows the `$state` rune in svelte-check's transform.
	let stateField = $state('CA');
	let zip = $state('94105');
</script>

<FormLayout>
	<FormLayout direction="horizontal">
		<TextInput label="First Name" value={first} onChange={(next) => (first = next)} />
		<TextInput label="Last Name" value={last} onChange={(next) => (last = next)} />
	</FormLayout>
	<TextInput label="Email" value={email} onChange={(next) => (email = next)} />
	<FormLayout direction="horizontal">
		<TextInput label="City" value={city} onChange={(next) => (city = next)} />
		<TextInput label="State" value={stateField} onChange={(next) => (stateField = next)} />
		<TextInput label="ZIP" value={zip} onChange={(next) => (zip = next)} />
	</FormLayout>
</FormLayout>
