<!--
	Ported from upstream's `templates/blocks/components/FormLayout/FormLayoutHorizontalLabels.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FormLayout, Selector, TextArea, TextInput } from '@astryx-svelte/core';

	let displayName = $state('Jane Doe');
	let email = $state('jane@example.com');
	let timezone = $state('America/Los_Angeles');
	let bio = $state('');
</script>

<FormLayout direction="horizontal-labels">
	<TextInput label="Display Name" value={displayName} onChange={(next) => (displayName = next)} />
	<TextInput label="Email" value={email} onChange={(next) => (email = next)} />
	<Selector
		label="Timezone"
		value={timezone}
		onChange={(v: string) => (timezone = v)}
		options={[
			{ label: 'Pacific Time', value: 'America/Los_Angeles' },
			{ label: 'Eastern Time', value: 'America/New_York' },
			{ label: 'UTC', value: 'UTC' }
		]}
	/>
	<TextArea label="Bio" value={bio} onChange={(next) => (bio = next)} rows={3} />
</FormLayout>
