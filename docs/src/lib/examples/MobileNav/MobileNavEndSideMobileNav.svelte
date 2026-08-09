<!--
	Ported from upstream's `templates/blocks/components/MobileNav/MobileNavEndSideMobileNav.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons for the two items, so they are registry
	substitutions: `Cog6ToothIcon` → `wrench`, `UsersIcon` → `info`. Stand-ins
	rather than true matches, the same ones the demo routes make. Retires with the
	icon registry (TODO.md).
-->
<script lang="ts">
	import { Button, MobileNav, SideNavItem, SideNavSection } from '@astryx-svelte/core';

	let isOpen = $state(false);
</script>

<Button label="Open from Right" onclick={() => (isOpen = true)} />
<MobileNav {isOpen} onOpenChange={(open) => (isOpen = open)} header="Settings" side="end">
	<SideNavSection title="Settings">
		<SideNavItem label="General" icon="wrench" href="/settings" />
		<SideNavItem label="Team" icon="info" href="/team" />
	</SideNavSection>
</MobileNav>
