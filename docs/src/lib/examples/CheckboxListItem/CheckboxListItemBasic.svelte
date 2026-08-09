<!--
	Ported from upstream's `templates/blocks/components/CheckboxListItem/CheckboxListItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxList, CheckboxListItem } from '@astryx-svelte/core';

	let value = $state<string[]>(['updates']);
</script>

<CheckboxList label="Email preferences" {value} onChange={(next) => (value = next)}>
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
</CheckboxList>
