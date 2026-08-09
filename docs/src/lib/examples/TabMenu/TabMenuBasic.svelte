<!--
	Ported from upstream's `templates/blocks/components/TabMenu/TabMenuBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Tab, TabList, TabMenu } from '@astryx-svelte/core';

	let value = $state('overview');
</script>

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="overview" label="Overview" />
	<Tab value="activity" label="Activity" />
	<TabMenu
		label="More"
		options={[
			{ value: 'settings', label: 'Settings' },
			{ value: 'billing', label: 'Billing' }
		]}
	/>
</TabList>
