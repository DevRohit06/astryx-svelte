<!--
	Ported from upstream's `templates/blocks/components/RadioList/RadioListWithDescriptions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { RadioList, RadioListItem } from '@astryx-svelte/core';

	let value = $state('');
</script>

<RadioList
	label="Notification preference"
	description="Choose how you would like to be notified"
	{value}
	onChange={(next) => (value = next)}
>
	<RadioListItem label="Email" value="email" description="Receive notifications via email" />
	<RadioListItem label="SMS" value="sms" description="Standard messaging rates apply" />
	<RadioListItem
		label="Push notification"
		value="push"
		description="Instant alerts on your device"
	/>
</RadioList>
