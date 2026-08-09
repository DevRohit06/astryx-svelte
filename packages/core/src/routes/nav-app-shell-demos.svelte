<script lang="ts">
	import {
		AppShell,
		Badge,
		Banner,
		Button,
		Icon,
		MobileNav,
		NavIcon,
		SideNav,
		SideNavHeading,
		SideNavItem,
		SideNavSection,
		Text,
		TopNav,
		TopNavHeading,
		TopNavItem
	} from '$lib/index.js';
	import { useMediaQuery } from '$lib/hooks/index.js';

	/**
	 * Upstream's `AppShell.stories.tsx`, as a sibling route component — the shape
	 * `command-palette-demos.svelte` and the `Theme` section's helpers already
	 * use, because nine full application shells with their own nav trees would
	 * otherwise bury the page.
	 *
	 * **9 of upstream's 10 stories.** `Playground` is absent: its `render` is
	 * `TopNavWithSideNav` with the two defaults (`variant="elevated"`,
	 * `height="fill"`) passed explicitly, and the rest of it is storybook
	 * `argTypes` controls, which a static page has no counterpart for. Same
	 * standing as `NumberInput`'s `ErrorStatus`/`WarningStatus`/`SuccessStatus`,
	 * which are covered by the block that *is* rendered.
	 *
	 * **Every shell is framed, and it is not cosmetic.** `AppShell` sets
	 * `height: 100dvh` (`fill`) or `min-height: 100dvh` (`auto`) on its root, so
	 * an unconstrained embed would be a full viewport tall *each* and the section
	 * would be unreadable. Each story therefore renders inside a fixed-height
	 * `.shell-frame` and the shell itself takes an inline `height`/`min-height`
	 * of `100%`: `style` is a documented `BaseProps` prop, and an inline
	 * declaration wins over StyleX's class, so the shell fills its frame rather
	 * than the viewport. Nothing else about the stories changes — `fill` still
	 * scrolls its own regions internally, and `auto` still grows with content and
	 * lets the *page* (here, the frame) scroll as a whole, which is the whole
	 * point of that mode.
	 *
	 * **Icon substitutions.** Upstream's stories are drawn entirely from
	 * Heroicons, of which the 26-name registry has one true match (`Bars3Icon` →
	 * `menu`). The rest use the nearest built-in, as the `Switch`/`CheckboxInput`/
	 * `NumberInput`/`NavHeadingMenu` blocks already do:
	 *
	 * | upstream | here |
	 * | --- | --- |
	 * | `Bars3Icon` | `menu` — a true match |
	 * | `HomeIcon` | `viewColumns` |
	 * | `ChartBarIcon` | `arrowUp` |
	 * | `FolderIcon` | `calendar` |
	 * | `Cog6ToothIcon` | `wrench` |
	 * | `DocumentTextIcon` | `copy` |
	 * | `ShieldCheckIcon` | `check` |
	 * | `UserGroupIcon` / `UserCircleIcon` | `info` |
	 * | `QuestionMarkCircleIcon` | `warning` |
	 * | `BellIcon` | `clock` |
	 * | `CubeIcon` | `stop` |
	 * | every `*IconSolid` (`selectedIcon`) | `success` |
	 *
	 * The last row is the one worth reading twice: the registry ships **no
	 * outline/solid pairs**, so `selectedIcon` cannot be "the same glyph, filled".
	 * `success` is the registry's only filled counterpart to a stroked glyph, so
	 * every selected item swaps to it — the swap the prop exists for stays
	 * visible, which passing the same name twice would not. Retires with the icon
	 * registry.
	 */

	// `WithMobileNav`'s own hooks — upstream calls both inside the story's render.
	const isMobile = useMediaQuery(() => '(max-width: 768px)');
	let mobileNavOpen = $state(false);
</script>

<!-- =====================================================================
     Helpers — upstream's `MockContent`, `AppTopNav`, `SideNavWithoutHeader`
     and `SideNavWithHeader`, as snippets.
     ===================================================================== -->

{#snippet mockContent(paragraphs: number)}
	<Text type="large">Page Content</Text>
	<div class="long-content">
		{#each Array.from({ length: paragraphs }, (_, i) => i) as i (i)}
			<Text type="body">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</Text>
		{/each}
	</div>
{/snippet}

<!-- `NavIcon.icon` is a Snippet where upstream takes a `ReactNode`, so the
     glyph is authored here rather than inline in the heading. -->
{#snippet cubeGlyph()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet appLogo()}<NavIcon icon={cubeGlyph} />{/snippet}
{#snippet profileGlyph()}<Icon icon="info" size="sm" />{/snippet}
{#snippet helpGlyph()}<Icon icon="warning" size="sm" />{/snippet}
{#snippet bellGlyph()}<Icon icon="clock" size="sm" />{/snippet}
{#snippet hamburgerGlyph()}<Icon icon="menu" size="sm" />{/snippet}
{#snippet badge12()}<Badge label="12" />{/snippet}
{#snippet badgeNew()}<Badge variant="info" label="New" />{/snippet}

<!--
	Upstream's `AppTopNav`. Its `endContent` parameter is not exercised by any
	story — every call site takes the default Profile button — so the snippet
	renders that branch rather than carrying an argument nothing passes.
-->
{#snippet appTopNavHeading()}
	<TopNavHeading heading="Acme App" logo={appLogo} />
{/snippet}

{#snippet appTopNavStart()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="Docs" href="#" />
{/snippet}

{#snippet appTopNavEnd()}
	<Button label="Profile" variant="ghost" icon={profileGlyph} isIconOnly />
{/snippet}

{#snippet appTopNav()}
	<TopNav
		label="Main navigation"
		heading={appTopNavHeading}
		startContent={appTopNavStart}
		endContent={appTopNavEnd}
	/>
{/snippet}

<!-- SideNav WITHOUT header — for use alongside a TopNav. -->
{#snippet sideNavWithoutHeader()}
	<SideNav>
		<SideNavSection title="Main" isHeaderHidden>
			<SideNavItem
				label="Dashboard"
				icon="viewColumns"
				selectedIcon="success"
				isSelected
				href="#"
			/>
			<SideNavItem label="Analytics" icon="arrowUp" selectedIcon="success" href="#" />
			<SideNavItem
				label="Projects"
				icon="calendar"
				selectedIcon="success"
				href="#"
				endContent={badge12}
			/>
		</SideNavSection>
		<SideNavSection title="Organization">
			<SideNavItem label="Team" icon="info" selectedIcon="success" href="#" />
			<SideNavItem label="Settings" icon="wrench" selectedIcon="success" href="#" />
		</SideNavSection>
	</SideNav>
{/snippet}

<!-- SideNav WITH header — standalone, no TopNav. -->
{#snippet sideNavWithHeaderHeader()}
	<SideNavHeading icon={appLogo} heading="Acme App" headingHref="#" />
{/snippet}

{#snippet sideNavWithHeader()}
	<SideNav header={sideNavWithHeaderHeader}>
		<SideNavSection title="Main" isHeaderHidden>
			<SideNavItem
				label="Dashboard"
				icon="viewColumns"
				selectedIcon="success"
				isSelected
				href="#"
			/>
			<SideNavItem label="Analytics" icon="arrowUp" selectedIcon="success" href="#" />
			<SideNavItem
				label="Projects"
				icon="calendar"
				selectedIcon="success"
				href="#"
				endContent={badge12}
			/>
		</SideNavSection>
		<SideNavSection title="Organization">
			<SideNavItem label="Team" icon="info" selectedIcon="success" href="#" />
			<SideNavItem label="Settings" icon="wrench" selectedIcon="success" href="#" />
		</SideNavSection>
	</SideNav>
{/snippet}

<!-- The banner `FullFeatured` and `WithBanner` both render, verbatim. -->
{#snippet maintenanceBanner()}
	<Banner
		status="info"
		container="section"
		title="System maintenance scheduled"
		description="The system will undergo maintenance tonight at 10pm UTC."
		isDismissable
	/>
{/snippet}

<!-- =====================================================================
     Story-local slots that need their own markup
     ===================================================================== -->

{#snippet fullFeaturedFooterIcons()}
	<Button label="Help" variant="ghost" icon={helpGlyph} isIconOnly />
	<Button label="Notifications" variant="ghost" icon={bellGlyph} isIconOnly />
	<Button label="Profile" variant="ghost" icon={profileGlyph} isIconOnly />
{/snippet}

{#snippet fullFeaturedSideNav()}
	<SideNav footerIcons={fullFeaturedFooterIcons}>
		<SideNavSection title="Main" isHeaderHidden>
			<SideNavItem
				label="Dashboard"
				icon="viewColumns"
				selectedIcon="success"
				isSelected
				href="#"
			/>
			<SideNavItem
				label="Analytics"
				icon="arrowUp"
				selectedIcon="success"
				href="#"
				endContent={badgeNew}
			/>
			<SideNavItem
				label="Projects"
				icon="calendar"
				selectedIcon="success"
				href="#"
				endContent={badge12}
			/>
		</SideNavSection>
		<SideNavSection title="Organization">
			<SideNavItem label="Team" icon="info" selectedIcon="success" href="#" />
			<SideNavItem label="Settings" icon="wrench" selectedIcon="success" href="#">
				<SideNavItem label="General" href="#" />
				<SideNavItem label="Security" href="#" />
				<SideNavItem label="Integrations" href="#" />
			</SideNavItem>
		</SideNavSection>
		<SideNavSection title="Resources">
			<SideNavItem label="Documentation" icon="copy" selectedIcon="success" href="#" />
			<SideNavItem label="Compliance" icon="check" selectedIcon="success" href="#" isDisabled />
		</SideNavSection>
	</SideNav>
{/snippet}

<!--
	`ControlledCollapse`'s top bar. The toggle is deliberately transcribed as
	upstream writes it — a `Button` with no handler. Its docstring describes an
	external-state collapse the story never wires; the rendered content is the
	button alone, and that is what a demo of the story shows.
-->
{#snippet controlledCollapseHeading()}
	<TopNavHeading heading="Acme App" />
{/snippet}

{#snippet controlledCollapseEnd()}
	<Button label="Toggle sidebar" variant="ghost" icon={hamburgerGlyph} isIconOnly />
{/snippet}

{#snippet controlledCollapseTopNav()}
	<TopNav
		label="Main navigation"
		heading={controlledCollapseHeading}
		endContent={controlledCollapseEnd}
	/>
{/snippet}

<!-- `WithMobileNav`. The nav sections are defined once and shared between
     `sideNav` and `mobileNav`, exactly as upstream shares its `navSections`. -->
{#snippet withMobileNavSections()}
	<SideNavSection title="Main" isHeaderHidden>
		<SideNavItem label="Dashboard" icon="viewColumns" selectedIcon="success" isSelected href="#" />
		<SideNavItem label="Analytics" icon="arrowUp" selectedIcon="success" href="#" />
		<SideNavItem
			label="Projects"
			icon="calendar"
			selectedIcon="success"
			href="#"
			endContent={badge12}
		/>
	</SideNavSection>
	<SideNavSection title="Organization">
		<SideNavItem label="Team" icon="info" selectedIcon="success" href="#" />
		<SideNavItem label="Settings" icon="wrench" selectedIcon="success" href="#" />
	</SideNavSection>
{/snippet}

<!-- Upstream passes `<Icon icon="menu" color="inherit" />` with no size — the
     one registry icon in the whole story file, and kept verbatim. -->
{#snippet menuGlyphInherit()}<Icon icon="menu" color="inherit" />{/snippet}

{#snippet withMobileNavStart()}
	{#if isMobile.matches}
		<Button
			label="Menu"
			variant="ghost"
			icon={menuGlyphInherit}
			onclick={() => (mobileNavOpen = true)}
			isIconOnly
		/>
	{:else}
		<TopNavItem label="Home" href="#" isSelected />
		<TopNavItem label="Products" href="#" />
		<TopNavItem label="Docs" href="#" />
	{/if}
{/snippet}

{#snippet withMobileNavEnd()}
	<Button label="Notifications" variant="ghost" icon={bellGlyph} isIconOnly />
	<Button label="Profile" variant="ghost" icon={profileGlyph} isIconOnly />
{/snippet}

{#snippet withMobileNavTopNav()}
	<TopNav
		label="Main navigation"
		heading={appTopNavHeading}
		startContent={withMobileNavStart}
		endContent={withMobileNavEnd}
	/>
{/snippet}

{#snippet withMobileNavSideNav()}
	<SideNav>{@render withMobileNavSections()}</SideNav>
{/snippet}

{#snippet withMobileNavDrawer()}
	<MobileNav
		isOpen={mobileNavOpen}
		onOpenChange={(open) => (mobileNavOpen = open)}
		header="Acme App"
	>
		{@render withMobileNavSections()}
	</MobileNav>
{/snippet}

<!-- =====================================================================
     Stories
     ===================================================================== -->

<div class="stories">
	<div class="story">
		<Text type="label">TopNavWithSideNav</Text>
		<div class="shell-frame">
			<AppShell
				contentPadding={6}
				topNav={appTopNav}
				sideNav={sideNavWithoutHeader}
				style="height: 100%"
			>
				{@render mockContent(3)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">SideNavOnly</Text>
		<div class="shell-frame">
			<AppShell contentPadding={6} sideNav={sideNavWithHeader} style="height: 100%">
				{@render mockContent(3)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">TopNavOnly</Text>
		<div class="shell-frame">
			<AppShell contentPadding={6} topNav={appTopNav} style="height: 100%">
				{@render mockContent(5)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">FullFeatured</Text>
		<div class="shell-frame">
			<AppShell
				contentPadding={6}
				topNav={appTopNav}
				sideNav={fullFeaturedSideNav}
				banner={maintenanceBanner}
				style="height: 100%"
			>
				{@render mockContent(3)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">AutoHeight</Text>
		<!-- `auto` grows with content and lets the page scroll as a whole, so the
		     frame is the scroller here rather than a clip. -->
		<div class="shell-frame shell-frame--scrolls">
			<AppShell
				contentPadding={6}
				topNav={appTopNav}
				sideNav={sideNavWithoutHeader}
				height="auto"
				style="min-height: 100%"
			>
				{@render mockContent(20)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">ControlledCollapse</Text>
		<div class="shell-frame">
			<AppShell
				contentPadding={6}
				topNav={controlledCollapseTopNav}
				sideNav={sideNavWithoutHeader}
				style="height: 100%"
			>
				{@render mockContent(3)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">ContentOnly</Text>
		<div class="shell-frame">
			<AppShell contentPadding={6} style="height: 100%">
				{@render mockContent(5)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">WithBanner</Text>
		<div class="shell-frame">
			<AppShell
				contentPadding={6}
				topNav={appTopNav}
				sideNav={sideNavWithoutHeader}
				banner={maintenanceBanner}
				style="height: 100%"
			>
				{@render mockContent(3)}
			</AppShell>
		</div>
	</div>

	<div class="story">
		<Text type="label">With Mobile Nav</Text>
		<!-- `useMediaQuery` measures the *viewport*, not the frame — upstream's
		     story has the same shape, and storybook's viewport addon is what
		     switches it. Narrow the browser below 768px to see the hamburger and
		     the drawer. -->
		<div class="shell-frame">
			<AppShell
				contentPadding={6}
				topNav={withMobileNavTopNav}
				sideNav={withMobileNavSideNav}
				mobileNav={withMobileNavDrawer}
				style="height: 100%"
			>
				{@render mockContent(3)}
			</AppShell>
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
		The shell's own height is viewport-relative (`100dvh`), so it has to be
		bounded here or every story would be a full screen tall. See the component
		comment: the frame supplies the bound and the shell takes `height: 100%`.
	*/
	.shell-frame {
		height: 480px;
		overflow: hidden;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-outer);
	}

	/* `height="auto"` grows with its content; the frame becomes the scroller. */
	.shell-frame--scrolls {
		overflow: auto;
	}

	/* Upstream's `styles.longContent`, verbatim. */
	.long-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
