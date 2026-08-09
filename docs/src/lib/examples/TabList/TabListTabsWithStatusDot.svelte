<!--
	Ported from upstream's `templates/blocks/components/TabList/TabListTabsWithStatusDot.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { StatusDot, Tab, TabList } from '@astryx-svelte/core';

	let value = $state('production');
</script>

{#snippet productionDot()}<StatusDot variant="success" label="Healthy" />{/snippet}
{#snippet stagingDot()}<StatusDot variant="warning" label="Degraded" />{/snippet}

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="production" label="Production" endContent={productionDot} />
	<Tab value="staging" label="Staging" endContent={stagingDot} />
	<Tab value="development" label="Development" />
</TabList>
