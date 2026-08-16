<!--
	Ported from upstream's `templates/blocks/components/AppShell/AppShellTopNavWithSideNav.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `CubeIcon` → `stop`, `HomeIcon` → `menu`,
	`ChartBarIcon` → `viewColumns`, `FolderIcon` → `copy`, `UsersIcon` → `info`,
	`Cog6ToothIcon` → `wrench`. Stand-ins rather than true matches, the same ones
	the demo routes make. Retires with the icon registry (port/todo.md).
-->
<script lang="ts">
	import {
		AppShell,
		Heading,
		Icon,
		NavIcon,
		SideNav,
		SideNavItem,
		SideNavSection,
		Text,
		TopNav,
		TopNavHeading,
		TopNavItem,
		VStack
	} from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="App Shell" {logo} />
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="Docs" href="#" />
{/snippet}

{#snippet topNav()}
	<TopNav label="Main navigation" {heading} {startContent} />
{/snippet}

{#snippet sideNav()}
	<SideNav>
		<SideNavSection title="Main" isHeaderHidden>
			<SideNavItem label="Dashboard" icon="menu" isSelected href="#" />
			<SideNavItem label="Analytics" icon="viewColumns" href="#" />
			<SideNavItem label="Projects" icon="copy" href="#" />
		</SideNavSection>
		<SideNavSection title="Organization">
			<SideNavItem label="Team" icon="info" href="#" />
			<SideNavItem label="Settings" icon="wrench" href="#" />
		</SideNavSection>
	</SideNav>
{/snippet}

<!--
	`AppShell` fills the viewport (`height: 100dvh`), and upstream's own blocks
	cut that down with `height: 100%` — which only resolves against an ancestor
	that has a definite height. Upstream's docsite gives every block an
	`aspectRatio: 4 / 3` frame; this one's preview container is shrink-to-fit on
	both axes, so the block supplies the frame itself. Same precedent as
	`AspectRatio/AspectRatioImageGallery.svelte`.
-->
<div style="width: 640px; height: 480px">
	<AppShell contentPadding={6} style="height: 100%; min-height: 0" {topNav} {sideNav}>
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</Text>
		</VStack>
	</AppShell>
</div>
