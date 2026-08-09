<!--
	Ported from upstream's `templates/blocks/components/TabList/TabListTabsWithMenu.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Tab, TabList, TabMenu } from '@astryx-svelte/core';

	let value = $state('home');
</script>

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="home" label="Home" />
	<Tab value="projects" label="Projects" />
	<TabMenu
		label="More"
		options={[
			{ value: 'analytics', label: 'Analytics' },
			{ value: 'reports', label: 'Reports' },
			{ value: 'billing', label: 'Billing' }
		]}
	/>
</TabList>
