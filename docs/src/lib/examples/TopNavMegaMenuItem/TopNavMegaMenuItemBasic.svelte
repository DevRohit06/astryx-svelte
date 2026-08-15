<!--
	Ported from upstream's
	`templates/blocks/components/TopNavMegaMenuItem/TopNavMegaMenuItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so both icons are registry substitutions:
	`BoltIcon` → `arrowUp`, `CircleStackIcon` → `stop`. Upstream sizes each one
	`width={20} height={20}`, which is the registry `Icon`'s default `md`.
	Stand-ins rather than true matches, the same ones the demo routes make.
	Retires with the icon registry (port/todo.md).
-->
<script lang="ts">
	import { Grid, Icon, TopNavMegaMenuItem } from '@astryx-svelte/core';
</script>

{#snippet boltIcon()}<Icon icon="arrowUp" size="md" />{/snippet}
{#snippet circleStackIcon()}<Icon icon="stop" size="md" />{/snippet}

<Grid columns={2} gap={2}>
	<TopNavMegaMenuItem
		title="Edge Functions"
		description="Run serverless code at the network edge"
		icon={boltIcon}
		href="#edge"
	/>
	<TopNavMegaMenuItem
		title="Storage"
		description="Object and file storage for your application"
		icon={circleStackIcon}
		href="#storage"
	/>
</Grid>
