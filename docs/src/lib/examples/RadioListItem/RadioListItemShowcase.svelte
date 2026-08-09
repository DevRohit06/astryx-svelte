<!--
	Ported from upstream's `templates/blocks/components/RadioListItem/RadioListItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { RadioList, RadioListItem } from '@astryx-svelte/core';

	let value = $state('standard');
</script>

<RadioList label="Shipping method" {value} onChange={(next) => (value = next)}>
	<RadioListItem label="Standard" value="standard" description="5–7 business days" />
	<RadioListItem label="Express" value="express" description="2–3 business days" />
	<RadioListItem label="Overnight" value="overnight" description="Next business day" />
	<RadioListItem
		label="Same day"
		value="sameday"
		description="Not available in your area"
		isDisabled
	/>
</RadioList>
