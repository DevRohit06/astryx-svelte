<!--
	Ported from upstream's `templates/blocks/components/TabList/TabListShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Tab, TabList } from '@astryx-svelte/core';

	let value = $state('home');
</script>

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="home" label="Home" />
	<Tab value="projects" label="Projects" />
	<Tab value="settings" label="Settings" />
</TabList>
