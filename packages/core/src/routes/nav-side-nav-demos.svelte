<script lang="ts">
	import {
		Badge,
		Button,
		Icon,
		ListItem,
		MoreMenu,
		NavIcon,
		SideNav,
		SideNavHeading,
		SideNavItem,
		SideNavSection,
		Text
	} from '$lib/index.js';

	/**
	 * Upstream's `SideNav.stories.tsx`, as a sibling route component — the
	 * `command-palette-demos.svelte` shape, because fourteen sidebars with their
	 * own headings, sections and menus would otherwise bury the page.
	 *
	 * **All 14 stories**, with one block inside one of them absent: see
	 * `Collapsible Items` below.
	 *
	 * Each sidebar sits in a **480px-tall frame**, which is upstream's own
	 * decorator (`<div style={{height: 480}}>`) rather than a choice made here —
	 * `SideNav`'s root is `height: 100%`, so it needs a bounded parent to have any
	 * height at all. They wrap into a row because fourteen 260px columns stacked
	 * vertically would be six thousand pixels of page.
	 *
	 * **Icon substitutions** follow the table in `nav-app-shell-demos.svelte`:
	 * `HomeIcon` → `viewColumns`, `ChartBarIcon` → `arrowUp`, `FolderIcon` →
	 * `calendar`, `Cog6ToothIcon` → `wrench`, `DocumentTextIcon` → `copy`,
	 * `UserGroupIcon` → `info`, `QuestionMarkCircleIcon` → `warning`, `BellIcon` →
	 * `clock`, `CubeIcon` → `stop`, and every `*IconSolid` (`selectedIcon`) →
	 * `success`, the registry's only filled counterpart to a stroked glyph.
	 * Retires with the icon registry.
	 */
</script>

<!-- =====================================================================
     Shared slot snippets
     ===================================================================== -->

{#snippet cubeGlyph()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet appLogo()}<NavIcon icon={cubeGlyph} />{/snippet}
{#snippet badge3()}<Badge label="3" />{/snippet}
{#snippet badge12()}<Badge label="12" />{/snippet}
{#snippet badge99()}<Badge label="99" />{/snippet}
{#snippet badgeNewNeutral()}<Badge label="New" />{/snippet}
{#snippet badge3Error()}<Badge label="3" variant="error" />{/snippet}
{#snippet badgeNewInfo()}<Badge label="New" variant="info" />{/snippet}

<!-- `Icon` takes a registry name where upstream passes the Heroicon component. -->
{#snippet helpGlyph()}<Icon icon="warning" size="md" />{/snippet}
{#snippet bellGlyph()}<Icon icon="clock" size="md" />{/snippet}
{#snippet settingsGlyph()}<Icon icon="wrench" size="sm" color="secondary" />{/snippet}

{#snippet footerIcons()}
	<Button label="Help" icon={helpGlyph} variant="ghost" size="sm" isIconOnly />
	<Button label="Notifications" icon={bellGlyph} variant="ghost" size="sm" isIconOnly />
{/snippet}

<!-- =====================================================================
     Default
     ===================================================================== -->

{#snippet defaultHeader()}
	<SideNavHeading icon={appLogo} heading="My App" headingHref="/" />
{/snippet}

<!-- =====================================================================
     Title Without Icon
     ===================================================================== -->

{#snippet titleWithoutIconHeader()}
	<SideNavHeading heading="My App" headingHref="/" />
{/snippet}

<!-- =====================================================================
     Header with Menu
     ===================================================================== -->

{#snippet accountMenu()}
	<ListItem label="Personal Account" href="#" />
	<ListItem label="Acme Corp" href="#" />
	<ListItem label="Add account" href="#" />
	<ListItem label="Sign out" href="#" />
{/snippet}

{#snippet withHeaderMenuHeader()}
	<SideNavHeading
		icon={appLogo}
		heading="Product Name"
		subheading="Business Account"
		menu={accountMenu}
	/>
{/snippet}

<!-- =====================================================================
     Suite with Independent Links
     ===================================================================== -->

{#snippet suiteMenu()}
	<ListItem label="Analytics" href="#" />
	<ListItem label="Commerce" href="#" />
	<ListItem label="Team Hub" href="#" />
{/snippet}

{#snippet suiteHeader()}
	<SideNavHeading
		icon={appLogo}
		superheading="Suite Name"
		superheadingHref="/suite"
		heading="Product Name"
		headingHref="/product"
		menu={suiteMenu}
	/>
{/snippet}

<!-- =====================================================================
     Headings shared by the remaining stories
     ===================================================================== -->

{#snippet plainHeader()}
	<SideNavHeading icon={appLogo} heading="My App" />
{/snippet}

{#snippet headingWithHref()}
	<SideNavHeading icon={appLogo} heading="My App" headingHref="/" />
{/snippet}

{#snippet headerEndContentHeader()}
	<SideNavHeading icon={appLogo} heading="My App" headingHref="/" headerEndContent={badge3Error} />
{/snippet}

{#snippet switchAccountMenu()}
	<ListItem label="Switch Account" href="#" />
	<ListItem label="Sign Out" href="#" />
{/snippet}

{#snippet headerEndContentWithMenuHeader()}
	<SideNavHeading
		icon={appLogo}
		heading="Product Name"
		subheading="Business Account"
		headerEndContent={badgeNewInfo}
		menu={switchAccountMenu}
	/>
{/snippet}

<!-- `End Content (Badges & Menus)` — the two rows whose end content is a
     component rather than a badge. -->
{#snippet teamCount()}
	<Text type="supporting" color="secondary">8 members</Text>
{/snippet}

{#snippet documentsShortcut()}
	<Text type="supporting" color="secondary">⌘D</Text>
{/snippet}

{#snippet settingsPending()}
	<Text type="supporting" color="secondary">3 pending</Text>
{/snippet}

{#snippet dashboardMoreMenu()}
	<MoreMenu
		size="sm"
		items={[
			{ label: 'Pin to top', onClick: () => {} },
			{ label: 'Rename', onClick: () => {} },
			{ label: 'Hide from sidebar', onClick: () => {} }
		]}
	/>
{/snippet}

{#snippet notificationsSettingsButton()}
	<Button label="Settings" icon={settingsGlyph} variant="ghost" size="sm" isIconOnly />
{/snippet}

<!-- =====================================================================
     Stories
     ===================================================================== -->

<div class="stories">
	<div class="story">
		<Text type="label">Default</Text>
		<div class="sidenav-frame">
			<SideNav header={defaultHeader}>
				<SideNavSection title="Main">
					<SideNavItem
						label="Dashboard"
						icon="viewColumns"
						selectedIcon="success"
						isSelected
						href="/dashboard"
					/>
					<SideNavItem
						label="Projects"
						icon="calendar"
						selectedIcon="success"
						href="/projects"
						endContent={badge3}
					/>
					<SideNavItem label="Analytics" icon="arrowUp" href="/analytics" />
					<SideNavItem label="Team" icon="info" href="/team" />
				</SideNavSection>
				<SideNavSection title="Documents">
					<SideNavItem label="All Documents" icon="copy" href="/documents" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Title Without Icon</Text>
		<div class="sidenav-frame">
			<SideNav header={titleWithoutIconHeader}>
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
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Header with Menu</Text>
		<div class="sidenav-frame">
			<SideNav header={withHeaderMenuHeader}>
				<SideNavSection title="Navigation">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Settings" icon="wrench" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Suite with Independent Links</Text>
		<div class="sidenav-frame">
			<SideNav header={suiteHeader}>
				<SideNavSection title="Main">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Projects" icon="calendar" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Nested Items</Text>
		<div class="sidenav-frame">
			<SideNav header={plainHeader}>
				<SideNavSection title="Main">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Settings" icon="wrench">
						<SideNavItem label="General" href="/settings/general" />
						<SideNavItem label="Security" href="/settings/security" />
						<SideNavItem label="Notifications" href="/settings/notifications" />
					</SideNavItem>
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">With Footer Icons</Text>
		<div class="sidenav-frame">
			<SideNav header={plainHeader} {footerIcons}>
				<SideNavSection title="Main">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Projects" icon="calendar" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Disabled Items</Text>
		<div class="sidenav-frame">
			<SideNav header={plainHeader}>
				<SideNavSection title="Main">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Projects" icon="calendar" />
					<SideNavItem label="Analytics (Coming Soon)" icon="arrowUp" isDisabled />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Hidden Section Header</Text>
		<div class="sidenav-frame">
			<SideNav header={plainHeader}>
				<SideNavSection title="Main navigation" isHeaderHidden>
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Projects" icon="calendar" />
					<SideNavItem label="Analytics" icon="arrowUp" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">End Content (Badges &amp; Menus)</Text>
		<div class="sidenav-frame">
			<SideNav header={headingWithHref}>
				<SideNavSection title="Navigation" isHeaderHidden>
					<SideNavItem
						label="Dashboard"
						icon="viewColumns"
						selectedIcon="success"
						isSelected
						href="/dashboard"
						endContent={dashboardMoreMenu}
					/>
					<SideNavItem label="Projects" icon="calendar" href="/projects" endContent={badge12} />
					<SideNavItem
						label="Analytics"
						icon="arrowUp"
						href="/analytics"
						endContent={badgeNewNeutral}
					/>
					<SideNavItem label="Team" icon="info" href="/team" endContent={teamCount} />
					<SideNavItem
						label="Notifications"
						icon="clock"
						href="/notifications"
						endContent={notificationsSettingsButton}
					/>
					<SideNavItem
						label="Documents"
						icon="copy"
						href="/documents"
						endContent={documentsShortcut}
					/>
					<SideNavItem
						label="Settings"
						icon="wrench"
						href="/settings"
						endContent={settingsPending}
					/>
					<SideNavItem
						label="A very long navigation label that should truncate with ellipsis"
						icon="copy"
						href="/long"
						endContent={badge99}
					/>
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Header End Content</Text>
		<div class="sidenav-frame">
			<SideNav header={headerEndContentHeader}>
				<SideNavSection title="Main">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
					<SideNavItem label="Projects" icon="calendar" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Header End Content + Menu</Text>
		<div class="sidenav-frame">
			<SideNav header={headerEndContentWithMenuHeader}>
				<SideNavSection title="Main">
					<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Collapsible Items</Text>
		<!--
			Upstream's story has three sections; the third, `Collapsible + onClick`,
			is **absent**: it drives the item with `alert('Settings clicked')`, and
			this page omits alert-driven blocks rather than substituting a handler
			of its own — the `TreeList` `Interactive` precedent.
		-->
		<div class="sidenav-frame">
			<SideNav header={plainHeader}>
				<SideNavSection title="Collapsible (no href)">
					<SideNavItem label="Settings" icon="wrench" collapsible>
						<SideNavItem label="General" href="/settings/general" />
						<SideNavItem label="Security" href="/settings/security" />
						<SideNavItem label="Notifications" href="/settings/notifications" />
					</SideNavItem>
					<SideNavItem label="Documents" icon="copy" collapsible={{ defaultIsCollapsed: true }}>
						<SideNavItem label="Drafts" href="/documents/drafts" />
						<SideNavItem label="Published" href="/documents/published" />
					</SideNavItem>
				</SideNavSection>
				<SideNavSection title="Collapsible + href">
					<SideNavItem label="Settings" icon="wrench" href="/settings" collapsible>
						<SideNavItem label="General" href="/settings/general" />
						<SideNavItem label="Security" href="/settings/security" />
						<SideNavItem label="Notifications" href="/settings/notifications" />
					</SideNavItem>
					<SideNavItem
						label="Documents"
						icon="copy"
						href="/documents"
						collapsible={{ defaultIsCollapsed: true }}
					>
						<SideNavItem label="Drafts" href="/documents/drafts" />
						<SideNavItem label="Published" href="/documents/published" />
					</SideNavItem>
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Collapsible Sidebar</Text>
		<div class="sidenav-frame">
			<SideNav collapsible header={headingWithHref} {footerIcons}>
				<SideNavSection title="Main">
					<SideNavItem
						label="Dashboard"
						icon="viewColumns"
						selectedIcon="success"
						isSelected
						href="/dashboard"
					/>
					<SideNavItem
						label="Projects"
						icon="calendar"
						selectedIcon="success"
						href="/projects"
						endContent={badge3}
					/>
					<SideNavItem label="Analytics" icon="arrowUp" href="/analytics" />
					<SideNavItem label="Team" icon="info" href="/team" />
				</SideNavSection>
				<SideNavSection title="Settings">
					<SideNavItem label="Settings" icon="wrench" collapsible>
						<SideNavItem label="General" href="/settings/general" />
						<SideNavItem label="Security" href="/settings/security" />
						<SideNavItem label="Notifications" href="/settings/notifications" />
					</SideNavItem>
					<SideNavItem label="Documents" icon="copy" href="/documents" />
				</SideNavSection>
			</SideNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">Iconless Nested Items</Text>
		<div class="sidenav-frame">
			<SideNav header={plainHeader}>
				<SideNavSection title="Main">
					<SideNavItem
						label="Dashboard"
						icon="viewColumns"
						selectedIcon="success"
						isSelected
						href="/dashboard"
					/>
					<SideNavItem label="Settings" icon="wrench" collapsible>
						<SideNavItem label="General" href="/settings/general" />
						<SideNavItem label="Security" href="/settings/security" />
						<SideNavItem label="Notifications" href="/settings/notifications" />
					</SideNavItem>
					<SideNavItem label="Reports" collapsible>
						<SideNavItem label="Monthly" href="/reports/monthly" />
						<SideNavItem label="Quarterly" href="/reports/quarterly" />
						<SideNavItem label="Annual" href="/reports/annual" />
					</SideNavItem>
					<SideNavItem label="Analytics" icon="arrowUp" href="/analytics" />
				</SideNavSection>
			</SideNav>
		</div>
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

	/*
		Upstream's own story decorator (`<div style={{height: 480}}>`) — `SideNav`
		is `height: 100%`, so without a bounded parent it has no height at all.
		The border is this page's, so the 260px column is visible against the page
		background.
	*/
	.sidenav-frame {
		height: 480px;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-outer);
		overflow: hidden;
	}
</style>
