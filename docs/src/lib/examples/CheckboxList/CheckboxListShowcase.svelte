<!--
	Ported from upstream's `templates/blocks/components/CheckboxList/CheckboxListShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxList, CheckboxListItem } from '@astryx-svelte/core';

	let value = $state<string[]>(['email']);
</script>

<CheckboxList
	label="Notification preferences"
	description="Choose how you would like to be notified"
	{value}
	onChange={(values) => (value = values)}
	hasDividers
>
	<CheckboxListItem label="Email" value="email" description="Weekly digest every Monday" />
	<CheckboxListItem
		label="Push notification"
		value="push"
		description="Instant alerts on your device"
	/>
	<CheckboxListItem label="SMS" value="sms" description="Standard messaging rates apply" />
</CheckboxList>
