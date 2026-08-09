<!--
	Ported from upstream's `templates/blocks/components/RadioList/RadioListShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { RadioList, RadioListItem } from '@astryx-svelte/core';

	let value = $state('');
</script>

<RadioList label="Notification preference" {value} onChange={(next) => (value = next)}>
	<RadioListItem label="Email" value="email" />
	<RadioListItem label="SMS" value="sms" />
	<RadioListItem label="Push notification" value="push" />
</RadioList>
