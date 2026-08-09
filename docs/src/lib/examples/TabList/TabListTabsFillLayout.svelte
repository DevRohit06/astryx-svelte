<!--
	Ported from upstream's `templates/blocks/components/TabList/TabListTabsFillLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Tab, TabList } from '@astryx-svelte/core';

	let value = $state('home');
</script>

<div style="width: 500px">
	<TabList {value} onChange={(next) => (value = next)} layout="fill" hasDivider>
		<Tab value="home" label="Home" />
		<Tab value="projects" label="Projects" />
		<Tab value="settings" label="Settings" />
	</TabList>
</div>
