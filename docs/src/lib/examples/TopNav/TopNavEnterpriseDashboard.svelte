<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavEnterpriseDashboard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's `search` is its own registry icon and transcribes as-is. The rest
	import Heroicons, so they are registry substitutions: `CubeIcon` → `stop`,
	`HomeIcon` → `menu`, `DocumentTextIcon` → `copy`, `BellIcon` → `warning` —
	stand-ins rather than true matches, the same ones the demo routes make.
	Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import { Button, Icon, NavIcon, TopNav, TopNavHeading, TopNavItem } from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="My App" {logo} headingHref="#" />
{/snippet}

{#snippet homeIcon()}<Icon icon="menu" size="sm" />{/snippet}
{#snippet documentTextIcon()}<Icon icon="copy" size="sm" />{/snippet}

{#snippet startContent()}
	<TopNavItem label="Dashboard" href="#" isSelected icon={homeIcon} />
	<TopNavItem label="Reports" href="#" icon={documentTextIcon} />
{/snippet}

{#snippet searchIcon()}<Icon icon="search" color="inherit" />{/snippet}
{#snippet bellIcon()}<Icon icon="warning" />{/snippet}

{#snippet endContent()}
	<Button label="Search" variant="ghost" icon={searchIcon} isIconOnly />
	<Button label="Notifications" variant="ghost" icon={bellIcon} isIconOnly />
	<Button label="Upgrade" variant="primary" />
{/snippet}

<TopNav label="Main navigation" {heading} {startContent} {endContent} />
