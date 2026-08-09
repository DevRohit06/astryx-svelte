<!--
	Ported from upstream's `templates/blocks/components/MobileNav/MobileNavWithoutTitleMobileNav.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The trigger's `menu` is upstream's own registry icon and transcribes as-is.
	The two nav items import Heroicons upstream, so those are registry
	substitutions: `HomeIcon` → `menu`, `FolderIcon` → `copy`. Stand-ins rather
	than true matches, the same ones the demo routes make. Retires with the icon
	registry (TODO.md).
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
<MobileNav {isOpen} onOpenChange={(open) => (isOpen = open)}>
	<SideNavSection title="Main">
		<SideNavItem label="Dashboard" icon="menu" isSelected href="/dashboard" />
		<SideNavItem label="Projects" icon="copy" href="/projects" />
	</SideNavSection>
</MobileNav>
