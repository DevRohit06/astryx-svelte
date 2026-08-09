<!--
	Ported from upstream's `templates/blocks/components/MobileNav/MobileNavShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream passes the registry's `menu` here, not a Heroicon, so the icon
	transcribes as-is; only the render shape changes, from an element to the
	snippet `Button.icon` takes. Upstream's `setIsOpen` becomes the `$state`
	assignment Svelte has instead of a setter.
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
		<SideNavItem label="Dashboard" isSelected href="/dashboard" />
		<SideNavItem label="Projects" href="/projects" />
		<SideNavItem label="Analytics" href="/analytics" />
	</SideNavSection>
	<SideNavSection title="Settings">
		<SideNavItem label="General" href="/settings" />
		<SideNavItem label="Team" href="/team" />
	</SideNavSection>
</MobileNav>
