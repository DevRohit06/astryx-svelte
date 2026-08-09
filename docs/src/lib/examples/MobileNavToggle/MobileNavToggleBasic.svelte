<!--
	Ported from upstream's `templates/blocks/components/MobileNavToggle/MobileNavToggleBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream passes the registry's `viewColumns` as the toggle's custom content,
	not a Heroicon, so it transcribes as-is — `MobileNavToggle`'s `children` is a
	snippet here, which is what `Button.icon` takes underneath.
-->
<script lang="ts">
	import {
		AppShellMobileContext,
		HStack,
		Icon,
		MobileNav,
		MobileNavToggle,
		SideNavItem,
		SideNavSection,
		Text
	} from '@astryx-svelte/core';

	let isOpen = $state(false);

	/**
	 * Upstream wraps the block in `<AppShellMobileContext.Provider value={…}>`.
	 * Svelte sets context during a component's own init, so the block *is* the
	 * provider: everything its template renders sees this value. The stored value
	 * is a **getter**, this port's context convention, so `isMobileNavOpen`
	 * tracks the `$state` rather than freezing at init — which is what upstream's
	 * re-render buys.
	 */
	AppShellMobileContext.set(() => ({
		isMobile: true,
		isMobileNavOpen: isOpen,
		toggleMobileNav: () => (isOpen = !isOpen),
		openMobileNav: () => (isOpen = true),
		closeMobileNav: () => (isOpen = false),
		isMobileNavEnabled: true,
		hasAutoToggle: false
	}));
</script>

<HStack gap={3} vAlign="center">
	<MobileNavToggle label="Open menu"><Icon icon="viewColumns" /></MobileNavToggle>
	<Text type="body" weight="bold">Page title</Text>
</HStack>
<MobileNav {isOpen} onOpenChange={(open) => (isOpen = open)} header="Navigation">
	<SideNavSection title="Pages">
		<SideNavItem label="Home" isSelected href="#" />
		<SideNavItem label="Settings" href="#" />
	</SideNavSection>
</MobileNav>
