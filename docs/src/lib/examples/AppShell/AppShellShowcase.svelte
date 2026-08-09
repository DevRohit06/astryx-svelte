<!--
	Ported from upstream's `templates/blocks/components/AppShell/AppShellShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `CubeIcon` → `stop`, `HomeIcon` → `menu`,
	`ChartBarIcon` → `viewColumns`, `DocumentTextIcon` → `copy`, `UsersIcon` →
	`info`. Only `search` (elsewhere) is a true match; these are stand-ins, the
	same ones the demo routes make. Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import {
		AppShell,
		Heading,
		Icon,
		NavIcon,
		SideNav,
		SideNavHeading,
		SideNavItem,
		SideNavSection,
		Text,
		VStack
	} from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet headingIcon()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet sideNavHeader()}
	<SideNavHeading icon={headingIcon} heading="App Shell" headingHref="#" />
{/snippet}

{#snippet sideNav()}
	<SideNav header={sideNavHeader}>
		<SideNavSection title="Main" isHeaderHidden>
			<SideNavItem label="Home" icon="menu" isSelected href="#" />
			<SideNavItem label="Reports" icon="viewColumns" href="#" />
			<SideNavItem label="Documents" icon="copy" href="#" />
			<SideNavItem label="Team" icon="info" href="#" />
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
	<AppShell contentPadding={6} style="height: 100%; min-height: 0; width: 100%" {sideNav}>
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
