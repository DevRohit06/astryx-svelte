<!--
	Ported from upstream's `templates/blocks/components/TopNavMenu/TopNavMenuBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so both icons are registry substitutions:
	`ChartBarIcon` → `viewColumns`, `Cog6ToothIcon` → `wrench`. Stand-ins rather
	than true matches, the same ones the demo routes make. Retires with the icon
	registry (TODO.md).

	`TopNavMenuItemData.icon` is a `Snippet` here where upstream's is a
	`ReactNode`, so each row's icon is a snippet reference in the same data array.
-->
<script lang="ts">
	import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@astryx-svelte/core';
</script>

{#snippet heading()}
	<TopNavHeading heading="Platform" />
{/snippet}

{#snippet chartBarIcon()}<Icon icon="viewColumns" />{/snippet}
{#snippet cogIcon()}<Icon icon="wrench" />{/snippet}

{#snippet startContent()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavMenu
		label="Tools"
		items={[
			{
				title: 'Analytics',
				description: 'View traffic and engagement metrics',
				icon: chartBarIcon,
				href: '#analytics'
			},
			{
				title: 'Settings',
				description: 'Configure your workspace',
				icon: cogIcon,
				href: '#settings'
			}
		]}
	/>
{/snippet}

<TopNav style="width: 600px" label="Main navigation" {heading} {startContent} />
