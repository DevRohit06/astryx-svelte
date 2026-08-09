<script lang="ts">
	import {
		Button,
		Icon,
		NavIcon,
		Text,
		TopNav,
		TopNavHeading,
		TopNavItem,
		TopNavMegaMenu,
		TopNavMegaMenuFeaturedCard,
		TopNavMegaMenuItem,
		TopNavMenu
	} from '$lib/index.js';
	import { GOLDEN_SUNSET } from './thumbnail-images.js';

	/**
	 * Upstream's `TopNav.stories.tsx` (**all 9**) and `TopNavMenu.stories.tsx`
	 * (**all 4** — two `TopNavMenu`, two `TopNavMegaMenu`), as a sibling route
	 * component. Thirteen full-width nav bars with their own headings, item sets
	 * and hover menus would otherwise bury the page; this is the
	 * `command-palette-demos.svelte` shape.
	 *
	 * Each bar renders in a bordered frame so its `width: 100%` box is visible
	 * against the page background. Upstream's storybook renders them
	 * `layout: 'fullscreen'`, where the browser chrome supplies that edge.
	 *
	 * **Icon substitutions** follow the table in `nav-app-shell-demos.svelte`.
	 * The two true matches are here: `MagnifyingGlassIcon` → `search` and (in the
	 * `AppShell` file) `Bars3Icon` → `menu`. The stand-ins used below are
	 * `HomeIcon` → `viewColumns`, `ChartBarIcon` → `arrowUp`, `Cog6ToothIcon` →
	 * `wrench`, `DocumentTextIcon` → `copy`, `ShieldCheckIcon` → `check`,
	 * `UserCircleIcon` → `info`, `BellIcon` → `clock`, `CubeIcon` → `stop`,
	 * `BoltIcon` → `warning`, `CodeBracketIcon` → `wrench` and `GlobeAltIcon` →
	 * `info`. Retires with the icon registry.
	 *
	 * **The mega menu's featured image is local.** Upstream points
	 * `TopNavMegaMenuFeaturedCard.image` at an Unsplash URL; this uses one of the
	 * four inline data-URI scenes `thumbnail-images.ts` already substitutes for
	 * upstream's CDN photos, for the reason recorded there — the demo stays
	 * self-contained and needs no network.
	 */

	// Upstream's `MegaMenu` story destructures the setter alone
	// (`const [, setMenuOpen]`): the value is never read, and the prop is in the
	// story to show the callback fires. Transcribed with the same shape — the
	// underscore is the repo's lint convention for a binding written but never
	// read, which is exactly what upstream's discarded state element is.
	let _megaMenuOpen = $state(false);
</script>

<!-- =====================================================================
     Shared glyphs and slots
     ===================================================================== -->

{#snippet cubeGlyph()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet homeGlyph()}<Icon icon="viewColumns" size="sm" />{/snippet}
{#snippet chartGlyph()}<Icon icon="arrowUp" size="sm" />{/snippet}
{#snippet cubeLogo()}<NavIcon icon={cubeGlyph} />{/snippet}
{#snippet homeLogo()}<NavIcon icon={homeGlyph} />{/snippet}
{#snippet chartLogo()}<NavIcon icon={chartGlyph} />{/snippet}

{#snippet searchGlyph()}<Icon icon="search" size="sm" />{/snippet}
{#snippet bellGlyph()}<Icon icon="clock" size="sm" />{/snippet}
{#snippet profileGlyph()}<Icon icon="info" size="sm" />{/snippet}
{#snippet settingsGlyph()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet documentGlyph()}<Icon icon="copy" size="sm" />{/snippet}

{#snippet profileButton()}
	<Button label="Profile" variant="ghost" icon={profileGlyph} isIconOnly />
{/snippet}

<!-- Mega menu / nav menu item icons — upstream sizes these 20px, i.e. `md`. -->
{#snippet analyticsMenuGlyph()}<Icon icon="arrowUp" size="md" />{/snippet}
{#snippet securityMenuGlyph()}<Icon icon="check" size="md" />{/snippet}
{#snippet automationMenuGlyph()}<Icon icon="warning" size="md" />{/snippet}
{#snippet devToolsMenuGlyph()}<Icon icon="wrench" size="md" />{/snippet}
{#snippet globeMenuGlyph()}<Icon icon="info" size="md" />{/snippet}

<!-- =====================================================================
     TopNav — Default
     ===================================================================== -->

{#snippet defaultHeading()}<TopNavHeading heading="My App" />{/snippet}

{#snippet defaultStart()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="About" href="#" />
{/snippet}

{#snippet defaultEnd()}
	<Button label="Search" variant="ghost" icon={searchGlyph} isIconOnly />
	<Button label="Notifications" variant="ghost" icon={bellGlyph} isIconOnly />
	<Button label="Profile" variant="ghost" icon={profileGlyph} isIconOnly />
{/snippet}

<!-- =====================================================================
     TopNav — ChildrenNavigationItems
     ===================================================================== -->

{#snippet childrenAliasHeading()}<TopNavHeading heading="Children Alias" />{/snippet}

<!-- =====================================================================
     TopNav — WithLogo
     ===================================================================== -->

{#snippet withLogoHeading()}
	<TopNavHeading heading="Dashboard" logo={cubeLogo} headingHref="#" />
{/snippet}

{#snippet withLogoStart()}
	<TopNavItem label="Overview" href="#" isSelected />
	<TopNavItem label="Analytics" href="#" />
	<TopNavItem label="Reports" href="#" />
{/snippet}

<!-- =====================================================================
     TopNav — TitleOnly
     ===================================================================== -->

{#snippet titleOnlyHeading()}
	<TopNavHeading heading="Simple App" logo={homeLogo} />
{/snippet}

{#snippet signInButton()}<Button label="Sign in" variant="primary" />{/snippet}

<!-- =====================================================================
     TopNav — NavItemStates
     ===================================================================== -->

{#snippet statesHeading()}<TopNavHeading heading="States" />{/snippet}

{#snippet statesStart()}
	<TopNavItem label="Selected" href="#" isSelected />
	<TopNavItem label="Default" href="#" />
	<TopNavItem label="Disabled" href="#" isDisabled />
	<TopNavItem label="With Icon" href="#" icon={settingsGlyph} />
{/snippet}

<!-- =====================================================================
     TopNav — CenteredNavigation / CenterContentWithoutEnd
     ===================================================================== -->

{#snippet myAppLogoHeading()}
	<TopNavHeading heading="My App" logo={cubeLogo} headingHref="#" />
{/snippet}

{#snippet centeredNav()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="About" href="#" />
{/snippet}

{#snippet centeredEnd()}
	<Button label="Search" variant="ghost" icon={searchGlyph} isIconOnly />
	<Button label="Profile" variant="ghost" icon={profileGlyph} isIconOnly />
{/snippet}

{#snippet centerWithoutEndNav()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
{/snippet}

<!-- =====================================================================
     TopNav — CenteredWithStartContent
     ===================================================================== -->

{#snippet dashboardChartHeading()}
	<TopNavHeading heading="Dashboard" logo={chartLogo} headingHref="#" />
{/snippet}

{#snippet backStart()}
	<TopNavItem label="Back" href="#" icon={homeGlyph} />
{/snippet}

{#snippet overviewCenter()}
	<TopNavItem label="Overview" href="#" isSelected />
	<TopNavItem label="Analytics" href="#" />
	<TopNavItem label="Reports" href="#" />
{/snippet}

<!-- =====================================================================
     TopNav — FullExample
     ===================================================================== -->

{#snippet enterpriseHeading()}
	<TopNavHeading heading="Enterprise Dashboard" logo={chartLogo} headingHref="#" />
{/snippet}

{#snippet fullExampleStart()}
	<TopNavItem label="Dashboard" href="#" isSelected icon={homeGlyph} />
	<TopNavItem label="Reports" href="#" icon={documentGlyph} />
	<TopNavItem label="Analytics" href="#" icon={chartGlyph} />
	<TopNavItem label="Settings" href="#" icon={settingsGlyph} />
{/snippet}

{#snippet fullExampleEnd()}
	<Button label="Search" variant="ghost" icon={searchGlyph} isIconOnly />
	<Button label="Notifications" variant="ghost" icon={bellGlyph} isIconOnly />
	<Button label="Upgrade" variant="primary" />
{/snippet}

<!-- =====================================================================
     TopNavMenu — Default
     ===================================================================== -->

{#snippet navMenuStart()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavMenu
		label="Products"
		items={[
			{
				title: 'Analytics',
				description: 'Track and analyze user behavior',
				icon: analyticsMenuGlyph,
				href: '#analytics'
			},
			{
				title: 'Security',
				description: 'Enterprise-grade protection',
				icon: securityMenuGlyph,
				href: '#security'
			},
			{
				title: 'Automation',
				description: 'Streamline your workflows',
				icon: automationMenuGlyph,
				href: '#automation'
			},
			{
				title: 'Developer Tools',
				description: 'APIs, SDKs, and CLI tools',
				icon: devToolsMenuGlyph,
				href: '#dev-tools'
			}
		]}
	/>
	<TopNavItem label="Pricing" href="#" />
{/snippet}

<!-- =====================================================================
     TopNavMenu — Multiple Menus
     ===================================================================== -->

{#snippet platformHeading()}<TopNavHeading heading="Platform" headingHref="#" />{/snippet}

{#snippet multipleMenusStart()}
	<TopNavMenu
		label="Products"
		items={[
			{
				title: 'Analytics',
				description: 'Track behavior',
				icon: analyticsMenuGlyph,
				href: '#'
			},
			{
				title: 'Security',
				description: 'Enterprise protection',
				icon: securityMenuGlyph,
				href: '#'
			}
		]}
	/>
	<TopNavMenu
		label="Resources"
		items={[
			{ title: 'Documentation', href: '#' },
			{ title: 'API Reference', href: '#' },
			{ title: 'Community Forum', href: '#' }
		]}
	/>
	<TopNavItem label="Pricing" href="#" />
{/snippet}

<!-- =====================================================================
     TopNavMegaMenu — Mega Menu
     ===================================================================== -->

{#snippet acmeHeading()}
	<TopNavHeading heading="Acme" logo={cubeLogo} headingHref="#" />
{/snippet}

{#snippet megaMenuItems()}
	<TopNavMegaMenuItem
		title="Analytics"
		description="Track and analyze user behavior across your apps"
		icon={analyticsMenuGlyph}
		href="#analytics"
	/>
	<TopNavMegaMenuItem
		title="Security"
		description="Enterprise-grade protection for your data"
		icon={securityMenuGlyph}
		href="#security"
	/>
	<TopNavMegaMenuItem
		title="Automation"
		description="Streamline workflows with intelligent tools"
		icon={automationMenuGlyph}
		href="#automation"
	/>
	<TopNavMegaMenuItem
		title="Developer Tools"
		description="APIs, SDKs, and CLI for integration"
		icon={devToolsMenuGlyph}
		href="#dev-tools"
	/>
	<TopNavMegaMenuItem
		title="Global Network"
		description="Low-latency edge infra in 40+ regions"
		icon={globeMenuGlyph}
		href="#network"
	/>
{/snippet}

{#snippet megaMenuFeatured()}
	<TopNavMegaMenuFeaturedCard
		title="What's new in v4.0"
		description="AI-powered analytics and real-time collaboration."
		image={GOLDEN_SUNSET}
		imageAlt="Team collaboration"
		linkLabel="Read the announcement"
		linkHref="#announcement"
	/>
{/snippet}

{#snippet megaMenuStart()}
	<TopNavMegaMenu
		label="Products"
		onOpenChange={(open) => (_megaMenuOpen = open)}
		items={megaMenuItems}
		featured={megaMenuFeatured}
	/>
	<TopNavItem label="Pricing" href="#" />
	<TopNavItem label="Docs" href="#" />
{/snippet}

{#snippet megaMenuEnd()}
	<Button label="Sign in" variant="ghost" />
	<Button label="Get started" variant="primary" />
{/snippet}

<!-- =====================================================================
     TopNavMegaMenu — Mega Menu (Simple)
     ===================================================================== -->

{#snippet appHeading()}<TopNavHeading heading="App" headingHref="#" />{/snippet}

{#snippet megaMenuSimpleItems()}
	<TopNavMegaMenuItem
		title="Dashboard"
		description="Overview of your key metrics"
		icon={analyticsMenuGlyph}
		href="#"
	/>
	<TopNavMegaMenuItem
		title="Integrations"
		description="Connect with your favorite tools"
		icon={devToolsMenuGlyph}
		href="#"
	/>
	<TopNavMegaMenuItem
		title="API Access"
		description="Programmatic access to all features"
		icon={globeMenuGlyph}
		href="#"
	/>
{/snippet}

{#snippet megaMenuSimpleStart()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavMegaMenu label="Features" items={megaMenuSimpleItems} />
{/snippet}

{#snippet signInPrimary()}<Button label="Sign in" variant="primary" />{/snippet}

<!-- =====================================================================
     Stories
     ===================================================================== -->

<div class="stories">
	<div class="story">
		<Text type="label">Default</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={defaultHeading}
				startContent={defaultStart}
				endContent={defaultEnd}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">ChildrenNavigationItems</Text>
		<!-- Nav items written as component content rather than `startContent` —
		     the `children` alias that keeps them from silently disappearing. -->
		<div class="nav-frame">
			<TopNav label="Main navigation" heading={childrenAliasHeading}>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavItem label="Products" href="#" />
				<TopNavItem label="About" href="#" />
			</TopNav>
		</div>
	</div>

	<div class="story">
		<Text type="label">WithLogo</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={withLogoHeading}
				startContent={withLogoStart}
				endContent={profileButton}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">TitleOnly</Text>
		<div class="nav-frame">
			<TopNav label="Main navigation" heading={titleOnlyHeading} endContent={signInButton} />
		</div>
	</div>

	<div class="story">
		<Text type="label">NavItemStates</Text>
		<div class="nav-frame">
			<TopNav label="Navigation states demo" heading={statesHeading} startContent={statesStart} />
		</div>
	</div>

	<div class="story">
		<Text type="label">CenteredNavigation</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={myAppLogoHeading}
				centerContent={centeredNav}
				endContent={centeredEnd}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">CenteredWithStartContent</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={dashboardChartHeading}
				startContent={backStart}
				centerContent={overviewCenter}
				endContent={profileButton}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">CenterContentWithoutEnd</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={myAppLogoHeading}
				centerContent={centerWithoutEndNav}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">FullExample</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={enterpriseHeading}
				startContent={fullExampleStart}
				endContent={fullExampleEnd}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">TopNavMenu — Default</Text>
		<div class="nav-frame">
			<TopNav
				label="Main navigation"
				heading={myAppLogoHeading}
				startContent={navMenuStart}
				endContent={profileButton}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">TopNavMenu — Multiple Menus</Text>
		<div class="nav-frame">
			<TopNav label="Main navigation" heading={platformHeading} startContent={multipleMenusStart} />
		</div>
	</div>

	<div class="story">
		<Text type="label">TopNavMegaMenu — Mega Menu</Text>
		<!-- Upstream wraps the bar in a `position: relative` div so the full-width
		     panel resolves against it; transcribed verbatim. -->
		<div class="nav-frame mega-anchor">
			<TopNav
				label="Marketing navigation"
				heading={acmeHeading}
				startContent={megaMenuStart}
				endContent={megaMenuEnd}
			/>
		</div>
	</div>

	<div class="story">
		<Text type="label">TopNavMegaMenu — Mega Menu (Simple)</Text>
		<div class="nav-frame mega-anchor">
			<TopNav
				label="Simple navigation"
				heading={appHeading}
				startContent={megaMenuSimpleStart}
				endContent={signInPrimary}
			/>
		</div>
	</div>
</div>

<style>
	.stories {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.story {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	/*
		Upstream renders these `layout: 'fullscreen'`, where the browser edge is
		what bounds the `width: 100%` bar. Embedded in a section, it needs one of
		its own to read as a bar at all.
	*/
	.nav-frame {
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-outer);
	}

	/* Upstream's `<div style={{position: 'relative'}}>` mega-menu wrapper. */
	.mega-anchor {
		position: relative;
	}
</style>
