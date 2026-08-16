<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavHoverMenu.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`CubeIcon` → `stop`, `ChartBarIcon` → `viewColumns`, `ShieldCheckIcon` →
	`success`, `BoltIcon` → `arrowUp`, `CodeBracketIcon` → `wrench`,
	`UserCircleIcon` → `info`. Stand-ins rather than true matches, the same ones
	the demo routes make. Retires with the icon registry (port/todo.md).

	`TopNavMenuItemData.icon` is a `Snippet` here where upstream's is a
	`ReactNode`, so each row's icon is a snippet reference in the same data array.
-->
<script lang="ts">
	import {
		Button,
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
{#snippet boltIcon()}<Icon icon="arrowUp" />{/snippet}
{#snippet codeBracketIcon()}<Icon icon="wrench" />{/snippet}

{#snippet startContent()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavMenu
		label="Products"
		items={[
			{
				title: 'Analytics',
				description: 'Track and analyze user behavior',
				icon: chartBarIcon,
				href: '#analytics'
			},
			{
				title: 'Security',
				description: 'Enterprise-grade protection',
				icon: shieldCheckIcon,
				href: '#security'
			},
			{
				title: 'Automation',
				description: 'Streamline your workflows',
				icon: boltIcon,
				href: '#automation'
			},
			{
				title: 'Developer Tools',
				description: 'APIs, SDKs, and CLI tools',
				icon: codeBracketIcon,
				href: '#dev-tools'
			}
		]}
	/>
	<TopNavItem label="Pricing" href="#" />
{/snippet}

{#snippet userCircleIcon()}<Icon icon="info" />{/snippet}

{#snippet endContent()}
	<Button label="Profile" variant="ghost" icon={userCircleIcon} isIconOnly />
{/snippet}

<TopNav label="Main navigation" {heading} {startContent} {endContent} />
