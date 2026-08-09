<!--
	Ported from upstream's `templates/blocks/components/TopNavItem/TopNavItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TopNav, TopNavHeading, TopNavItem } from '@astryx-svelte/core';
</script>

{#snippet heading()}
	<TopNavHeading heading="App" />
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Dashboard" href="#" isSelected />
	<TopNavItem label="Projects" href="#" />
	<TopNavItem label="Reports" href="#" />
{/snippet}

<TopNav label="Main navigation" {heading} {startContent} />
