<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavCenteredNavigation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's `search` is its own registry icon and transcribes as-is. The other
	two import Heroicons, so they are registry substitutions: `CubeIcon` → `stop`,
	`UserCircleIcon` → `info` — the same stand-ins the `Selector` demo makes.
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

{#snippet centerContent()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="About" href="#" />
{/snippet}

{#snippet searchIcon()}<Icon icon="search" color="inherit" />{/snippet}
{#snippet userCircleIcon()}<Icon icon="info" />{/snippet}

{#snippet endContent()}
	<Button label="Search" variant="ghost" icon={searchIcon} isIconOnly />
	<Button label="Profile" variant="ghost" icon={userCircleIcon} isIconOnly />
{/snippet}

<TopNav label="Main navigation" {heading} {centerContent} {endContent} />
