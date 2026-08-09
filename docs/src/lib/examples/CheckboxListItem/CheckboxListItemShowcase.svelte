<!--
	Ported from upstream's `templates/blocks/components/CheckboxListItem/CheckboxListItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxList, CheckboxListItem } from '@astryx-svelte/core';

	let value = $state<string[]>(['updates', 'security']);
</script>

<CheckboxList label="Email preferences" {value} onChange={(values) => (value = values)} hasDividers>
	<CheckboxListItem
		label="Product updates"
		value="updates"
		description="New features and improvements"
	/>
	<CheckboxListItem
		label="Security alerts"
		value="security"
		description="Important account security notifications"
	/>
	<CheckboxListItem
		label="Marketing"
		value="marketing"
		description="Tips, offers, and promotions"
	/>
	<CheckboxListItem
		label="Beta program"
		value="beta"
		description="Currently closed to new members"
		isDisabled
	/>
</CheckboxList>
