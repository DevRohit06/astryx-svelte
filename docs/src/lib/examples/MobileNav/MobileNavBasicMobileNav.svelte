<!--
	Ported from upstream's `templates/blocks/components/MobileNav/MobileNavBasicMobileNav.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The trigger's `menu` is upstream's own registry icon and transcribes as-is.
	The nav items import Heroicons upstream, so those are registry substitutions:
	`HomeIcon` → `menu`, `FolderIcon` → `copy`, `ChartBarIcon` → `viewColumns`,
	`Cog6ToothIcon` → `wrench`, `UsersIcon` → `info`. Stand-ins rather than true
	matches, the same ones the demo routes make. Retires with the icon registry
	(port/todo.md).
-->
<script lang="ts">
	import { Button, Icon, MobileNav, SideNavItem, SideNavSection } from '@astryx-svelte/core';

	let isOpen = $state(false);
</script>

{#snippet menuIcon()}<Icon icon="menu" color="inherit" />{/snippet}

<Button
	label="Open Navigation"
	icon={menuIcon}
	variant="ghost"
	onclick={() => (isOpen = true)}
	isIconOnly
/>
<MobileNav {isOpen} onOpenChange={(open) => (isOpen = open)} header="Navigation">
	<SideNavSection title="Main">
		<SideNavItem label="Dashboard" icon="menu" isSelected href="/dashboard" />
		<SideNavItem label="Projects" icon="copy" href="/projects" />
		<SideNavItem label="Analytics" icon="viewColumns" href="/analytics" />
	</SideNavSection>
	<SideNavSection title="Settings">
		<SideNavItem label="General" icon="wrench" href="/settings" />
		<SideNavItem label="Team" icon="info" href="/team" />
	</SideNavSection>
</MobileNav>
