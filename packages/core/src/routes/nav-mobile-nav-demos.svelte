<script lang="ts">
	import {
		Button,
		Icon,
		MobileNav,
		NavIcon,
		SideNav,
		SideNavHeading,
		SideNavItem,
		SideNavSection,
		Text
	} from '$lib/index.js';
	import { useMediaQuery } from '$lib/hooks/index.js';

	/**
	 * Upstream's `MobileNav.stories.tsx` — **all 6** — as a sibling route
	 * component, the `command-palette-demos.svelte` shape.
	 *
	 * `MobileNav` is a native `<dialog>` opened with `showModal()`, so it takes
	 * the browser's top layer and covers the page. **Every story keeps its own
	 * open state, and all of them start closed** — a drawer left open on mount
	 * would sit over the whole demo page with no way past it but Escape. Each
	 * button opens exactly one drawer.
	 *
	 * **Icon substitutions** follow the table in `nav-app-shell-demos.svelte`:
	 * `HomeIcon` → `viewColumns`, `ChartBarIcon` → `arrowUp`, `FolderIcon` →
	 * `calendar`, `Cog6ToothIcon` → `wrench`, `UserGroupIcon` → `info`,
	 * `CubeIcon` → `stop`, and `*IconSolid` (`selectedIcon`) → `success`. The
	 * `menu` icon in the two hamburger buttons is upstream's own registry name,
	 * not a substitution. Retires with the icon registry.
	 */

	let defaultOpen = $state(false);
	let sideNavChildrenOpen = $state(false);
	let responsiveOpen = $state(false);
	let endSideOpen = $state(false);
	let customWidthOpen = $state(false);
	let withoutTitleOpen = $state(false);

	// `Responsive Pattern` switches on the viewport, exactly as upstream's story
	// does — narrow the browser below 768px to see the drawer branch.
	const isMobile = useMediaQuery(() => '(max-width: 768px)');
</script>

<!-- Upstream passes `<Icon icon="menu" color="inherit" />` — a registry name, so
     this is verbatim rather than a stand-in. -->
{#snippet menuGlyph()}<Icon icon="menu" color="inherit" />{/snippet}
{#snippet cubeGlyph()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet appLogo()}<NavIcon icon={cubeGlyph} />{/snippet}

<!-- `With SideNav Children` and `Responsive Pattern` each define their nav
     sections once and share them between the drawer and the sidebar. -->
{#snippet sideNavChildrenSections()}
	<SideNavSection title="Main">
		<SideNavItem
			label="Dashboard"
			icon="viewColumns"
			selectedIcon="success"
			isSelected
			href="/dashboard"
		/>
		<SideNavItem label="Projects" icon="calendar" selectedIcon="success" href="/projects" />
		<SideNavItem label="Analytics" icon="arrowUp" href="/analytics" />
	</SideNavSection>
	<SideNavSection title="Settings">
		<SideNavItem label="General" icon="wrench" href="/settings" />
	</SideNavSection>
{/snippet}

{#snippet responsiveSections()}
	<SideNavSection title="Main">
		<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected href="/" />
		<SideNavItem label="Projects" icon="calendar" selectedIcon="success" href="/projects" />
		<SideNavItem label="Analytics" icon="arrowUp" href="/analytics" />
	</SideNavSection>
	<SideNavSection title="Settings">
		<SideNavItem label="General" icon="wrench" href="/settings" />
		<SideNavItem label="Team" icon="info" href="/team" />
	</SideNavSection>
{/snippet}

{#snippet responsiveSideNavHeader()}
	<SideNavHeading icon={appLogo} heading="My App" headingHref="/" />
{/snippet}

<div class="stories">
	<div class="story">
		<Text type="label">Default</Text>
		<div>
			<Button
				label="Open Navigation"
				icon={menuGlyph}
				variant="ghost"
				onclick={() => (defaultOpen = true)}
				isIconOnly
			/>
		</div>
		<MobileNav
			isOpen={defaultOpen}
			onOpenChange={(open) => (defaultOpen = open)}
			header="Navigation"
		>
			<SideNavSection title="Main">
				<SideNavItem
					label="Dashboard"
					icon="viewColumns"
					selectedIcon="success"
					isSelected
					href="/dashboard"
				/>
				<SideNavItem label="Projects" icon="calendar" selectedIcon="success" href="/projects" />
				<SideNavItem label="Analytics" icon="arrowUp" href="/analytics" />
			</SideNavSection>
			<SideNavSection title="Settings">
				<SideNavItem label="General" icon="wrench" href="/settings" />
				<SideNavItem label="Team" icon="info" href="/team" />
			</SideNavSection>
		</MobileNav>
	</div>

	<div class="story">
		<Text type="label">With SideNav Children</Text>
		<div>
			<Button label="Open Drawer" onclick={() => (sideNavChildrenOpen = true)} />
		</div>
		<MobileNav
			isOpen={sideNavChildrenOpen}
			onOpenChange={(open) => (sideNavChildrenOpen = open)}
			header="My App"
		>
			{@render sideNavChildrenSections()}
		</MobileNav>
	</div>

	<div class="story">
		<Text type="label">Responsive Pattern</Text>
		{#if isMobile.matches}
			<div>
				<Button
					label="Menu"
					icon={menuGlyph}
					variant="ghost"
					onclick={() => (responsiveOpen = true)}
					isIconOnly
				/>
			</div>
			<MobileNav
				isOpen={responsiveOpen}
				onOpenChange={(open) => (responsiveOpen = open)}
				header="My App"
			>
				{@render responsiveSections()}
			</MobileNav>
		{:else}
			<!-- Upstream's desktop branch, inline style and all. -->
			<div style="width: 280px; height: 600px; border: 1px solid #e5e7eb;">
				<SideNav header={responsiveSideNavHeader}>
					{@render responsiveSections()}
				</SideNav>
			</div>
		{/if}
	</div>

	<div class="story">
		<Text type="label">End Side</Text>
		<div>
			<Button label="Open from Right" onclick={() => (endSideOpen = true)} />
		</div>
		<MobileNav
			isOpen={endSideOpen}
			onOpenChange={(open) => (endSideOpen = open)}
			header="Settings"
			side="end"
		>
			<SideNavSection title="Settings">
				<SideNavItem label="General" icon="wrench" href="/settings" />
				<SideNavItem label="Team" icon="info" href="/team" />
			</SideNavSection>
		</MobileNav>
	</div>

	<div class="story">
		<Text type="label">Custom Width</Text>
		<div>
			<Button label="Open Wide Drawer" onclick={() => (customWidthOpen = true)} />
		</div>
		<MobileNav
			isOpen={customWidthOpen}
			onOpenChange={(open) => (customWidthOpen = open)}
			header="Wide Navigation"
			width={360}
		>
			<SideNavSection title="Main">
				<SideNavItem
					label="Dashboard"
					icon="viewColumns"
					selectedIcon="success"
					isSelected
					href="/dashboard"
				/>
				<SideNavItem label="Projects" icon="calendar" href="/projects" />
			</SideNavSection>
		</MobileNav>
	</div>

	<div class="story">
		<Text type="label">Without Title</Text>
		<div>
			<Button
				label="Open Navigation"
				icon={menuGlyph}
				variant="ghost"
				onclick={() => (withoutTitleOpen = true)}
				isIconOnly
			/>
		</div>
		<MobileNav isOpen={withoutTitleOpen} onOpenChange={(open) => (withoutTitleOpen = open)}>
			<SideNavSection title="Main">
				<SideNavItem label="Dashboard" icon="viewColumns" isSelected href="/dashboard" />
				<SideNavItem label="Projects" icon="calendar" href="/projects" />
			</SideNavSection>
		</MobileNav>
	</div>
</div>

<style>
	.stories {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		gap: var(--spacing-6);
	}

	.story {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}
</style>
