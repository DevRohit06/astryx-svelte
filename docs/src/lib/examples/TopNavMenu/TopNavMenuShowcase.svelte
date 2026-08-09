<!--
	Ported from upstream's `templates/blocks/components/TopNavMenu/TopNavMenuShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so the icons are registry substitutions:
	`ChartBarIcon` → `viewColumns`, `UsersIcon` → `info`, `Cog6ToothIcon` →
	`wrench`, and `MagnifyingGlassIcon` → `search`, which is a true match rather
	than a stand-in. Retires with the icon registry (TODO.md).

	`TopNavMenuItemData.icon` is a `Snippet` here where upstream's is a
	`ReactNode`, so each row's icon is a snippet reference in the same data array.
-->
<script lang="ts">
	import { Button, Icon, TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@astryx-svelte/core';
</script>

{#snippet heading()}
	<TopNavHeading heading="Platform" />
{/snippet}

{#snippet chartBarIcon()}<Icon icon="viewColumns" />{/snippet}
{#snippet usersIcon()}<Icon icon="info" />{/snippet}
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
				title: 'Team Members',
				description: 'Manage your team and permissions',
				icon: usersIcon,
				href: '#team'
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

{#snippet searchIcon()}<Icon icon="search" />{/snippet}

{#snippet endContent()}
	<Button label="Search" variant="ghost" icon={searchIcon} isIconOnly />
{/snippet}

<TopNav style="width: 600px" label="Menu demo" {heading} {startContent} {endContent} />
