<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's `search` is its own registry icon and transcribes as-is. The other
	three import Heroicons, so they are registry substitutions: `CubeIcon` →
	`stop`, `BellIcon` → `warning`, `UserCircleIcon` → `info` — the same
	stand-ins the `Selector` demo makes. Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import { Button, Icon, NavIcon, TopNav, TopNavHeading, TopNavItem } from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="My App" {logo} />
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="About" href="#" />
{/snippet}

{#snippet searchIcon()}<Icon icon="search" color="inherit" />{/snippet}
{#snippet bellIcon()}<Icon icon="warning" />{/snippet}
{#snippet userCircleIcon()}<Icon icon="info" />{/snippet}

{#snippet endContent()}
	<Button label="Search" variant="ghost" icon={searchIcon} isIconOnly />
	<Button label="Notifications" variant="ghost" icon={bellIcon} isIconOnly />
	<Button label="Profile" variant="ghost" icon={userCircleIcon} isIconOnly />
{/snippet}

<TopNav style="width: 600px" label="Main navigation" {heading} {startContent} {endContent} />
