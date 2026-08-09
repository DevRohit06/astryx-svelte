<!--
	Ported from upstream's `templates/blocks/components/FormLayout/FormLayoutMixedControls.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		CheckboxList,
		CheckboxListItem,
		FormLayout,
		Selector,
		TextInput
	} from '@astryx-svelte/core';

	let name = $state('Maya Torres');
	let role = $state('editor');
	let notifications = $state(['email', 'push']);
</script>

<FormLayout>
	<TextInput label="Full Name" value={name} onChange={(next) => (name = next)} />
	<Selector
		label="Role"
		value={role}
		onChange={(v: string) => (role = v)}
		options={[
			{ label: 'Viewer', value: 'viewer' },
			{ label: 'Editor', value: 'editor' },
			{ label: 'Admin', value: 'admin' }
		]}
	/>
	<CheckboxList
		label="Notifications"
		value={notifications}
		onChange={(next) => (notifications = next)}
	>
		<CheckboxListItem label="Email" value="email" />
		<CheckboxListItem label="SMS" value="sms" />
		<CheckboxListItem label="Push" value="push" />
	</CheckboxList>
</FormLayout>
