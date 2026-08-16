<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavWithLogo.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so both icons are registry substitutions:
	`CubeIcon` → `stop`, `UserCircleIcon` → `info` — the same stand-ins the
	`Selector` demo makes. Retires with the icon registry (port/todo.md).
-->
<script lang="ts">
	import { Button, Icon, NavIcon, TopNav, TopNavHeading, TopNavItem } from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="My App" {logo} headingHref="#" />
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Overview" href="#" isSelected />
	<TopNavItem label="Analytics" href="#" />
	<TopNavItem label="Reports" href="#" />
{/snippet}

{#snippet userCircleIcon()}<Icon icon="info" />{/snippet}

{#snippet endContent()}
	<Button label="Profile" variant="ghost" icon={userCircleIcon} isIconOnly />
{/snippet}

<TopNav label="Main navigation" {heading} {startContent} {endContent} />
