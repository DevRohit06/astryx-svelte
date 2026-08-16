<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavMultipleDropdowns.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`CubeIcon` → `stop`, `ChartBarIcon` → `viewColumns`, `ShieldCheckIcon` →
	`success`. Stand-ins rather than true matches, the same ones the demo routes
	make. Retires with the icon registry (port/todo.md).

	`TopNavMenuItemData.icon` is a `Snippet` here where upstream's is a
	`ReactNode`, so each row's icon is a snippet reference in the same data array.
-->
<script lang="ts">
	import {
		Icon,
		NavIcon,
		TopNav,
		TopNavHeading,
		TopNavItem,
		TopNavMenu
	} from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="My App" {logo} headingHref="#" />
{/snippet}

{#snippet chartBarIcon()}<Icon icon="viewColumns" />{/snippet}
{#snippet shieldCheckIcon()}<Icon icon="success" />{/snippet}

{#snippet startContent()}
	<TopNavMenu
		label="Products"
		items={[
			{
				title: 'Analytics',
				description: 'Track behavior',
				icon: chartBarIcon,
				href: '#'
			},
			{
				title: 'Security',
				description: 'Enterprise protection',
				icon: shieldCheckIcon,
				href: '#'
			}
		]}
	/>
	<TopNavMenu
		label="Resources"
		items={[
			{ title: 'Documentation', href: '#' },
			{ title: 'API Reference', href: '#' },
			{ title: 'Community Forum', href: '#' }
		]}
	/>
	<TopNavItem label="Pricing" href="#" />
{/snippet}

<TopNav label="Main navigation" {heading} {startContent} />
