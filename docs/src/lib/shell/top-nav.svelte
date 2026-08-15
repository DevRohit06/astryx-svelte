<script lang="ts">
	import {
		Button,
		HStack,
		Icon,
		MobileNav,
		TopNav,
		TopNavHeading,
		TopNavItem,
		useAppShellMobile,
		useTopNavRenderMode
	} from '@astryx-svelte/core';
	import { page } from '$app/state';
	import { NAV_ITEMS, REPO_URL, isActive } from './nav-items.js';
	import { homeHref, topicHref } from './links.js';
	import AstryxLogo from './astryx-logo.svelte';
	import GithubLogo from './github-logo.svelte';
	import HeartHandshakeIcon from './heart-handshake-icon.svelte';
	import MoonIcon from './moon-icon.svelte';
	import SunIcon from './sun-icon.svelte';
	import SearchPalette from './search-palette.svelte';
	import TopNavDrawerScope from './top-nav-drawer-scope.svelte';

	/**
	 * The site header, ported from upstream's `components/SharedTopNav.tsx`.
	 *
	 * Upstream's composition, kept: a logo-only `TopNavHeading` linking home, the
	 * nav links as `centerContent`, and an `endContent` of `HStack gap={2}`
	 * wrapping an `HStack gap={0.5}` of ghost icon `Button`s, the primary "Get
	 * started" CTA, and a hamburger that only appears when `AppShell` is not
	 * already providing one.
	 *
	 * Three pieces of behaviour come with it:
	 *
	 * - **`useTopNavRenderMode()`.** In `'drawer'` mode the links render bare,
	 *   because `AppShell`'s drawer supplies its own vertical list and the
	 *   `.desktop-nav` wrapper's `display: none` would hide them there.
	 * - **`useAppShellMobile()`.** When `AppShell` owns the mobile drawer (the
	 *   docs and components routes, which have a `sideNav`) this defers to its
	 *   single hamburger; everywhere else — the landing page — it renders its own
	 *   `MobileNav`, so the two never open two overlays.
	 * - **The `⌘K` handler and the `SearchPalette` live here**, as upstream's do.
	 *   `AppShell` takes this whole component as its `topNav`, so the palette
	 *   mounts inside that slot exactly as upstream's does; it is a `Layer`, so
	 *   where it mounts is not where it paints.
	 *
	 * **Not ported: the Community icon button** (`/community`) and upstream's
	 * `trackSearch`/`trackClickCta` analytics calls. The first is a route outside
	 * the v1 cut, and `nav-items.ts` already records why a link to a 404 is worse
	 * than no link; the second has no counterpart here. Both are in port/todo.md.
	 *
	 * The desktop links and the mobile hamburger both live in the DOM at all
	 * times; a pure CSS media query decides which is visible, so the
	 * server-rendered HTML is correct on first paint (no post-hydration flip).
	 * That is upstream's reasoning, and it is why these are media queries rather
	 * than a `useMediaQuery`.
	 */
	interface Props {
		/** Resolved colour mode — drives the toggle's label. */
		mode: 'light' | 'dark';
		/** Raw mode; `'system'` selects the CSS-driven icon branch below. */
		themeMode: 'system' | 'light' | 'dark';
		onToggleMode: () => void;
	}

	const { mode, themeMode, onToggleMode }: Props = $props();

	const appShellMobile = useAppShellMobile();
	const renderMode = useTopNavRenderMode();

	let isSearchOpen = $state(false);
	let isMenuOpen = $state(false);

	const pathname = $derived(page.url.pathname);
	const isMobileNavEnabled = $derived(appShellMobile().isMobileNavEnabled);

	const modeLabel = $derived(mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode');

	function handleKeydown(event: KeyboardEvent): void {
		if (event.defaultPrevented) return;
		if (
			(event.metaKey || event.ctrlKey) &&
			!event.shiftKey &&
			!event.altKey &&
			event.key.toLowerCase() === 'k'
		) {
			event.preventDefault();
			isSearchOpen = true;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet brandLogo()}
	<AstryxLogo size={24} isDecorative />
{/snippet}

{#snippet heading()}
	<TopNavHeading logo={brandLogo} logoLabel="astryx-svelte" headingHref={homeHref()} />
{/snippet}

<!--
	Upstream's `navLinks(onNavigate?)`. The drawer copy closes the overlay it
	sits in; the bar copy has nothing to close.
-->
{#snippet navLinks(onNavigate?: () => void)}
	{#each NAV_ITEMS as item (item.href)}
		<TopNavItem
			label={item.label}
			href={item.href}
			isSelected={isActive(item, pathname)}
			onclick={onNavigate}
		/>
	{/each}
{/snippet}

{#snippet centerContent()}
	{#if renderMode() === 'drawer'}
		<!--
			Bare items — AppShell's drawer supplies its own vertical list; the
			.desktop-nav wrapper would hide them (display:none) here.
		-->
		{@render navLinks(appShellMobile().closeMobileNav)}
	{:else}
		<div class="desktop-nav">{@render navLinks()}</div>
	{/if}
{/snippet}

<!--
	**The end-content row is 16px, where upstream's is 20px — a deliberate
	divergence, recorded in port/todo.md under Known debts.** `SharedTopNav` renders
	`<Search size={20} />`, `<Moon size={20} />`, `<Sun size={20} />`,
	`<HeartHandshake size={20} />` and `<Menu size={20} />`; this port sizes all
	of them at 16 (`Icon`'s `sm`, 1rem at a 16px root) on the maintainer's call.

	What matters is that the row is *uniform*, which it was not: search and the
	hamburger were `sm` (16px) while the mode toggle and GitHub mark were 20px,
	so two glyphs sat visibly larger than the two beside them. Equalising is the
	fix either way; the number is the choice.
-->
{#snippet searchIcon()}<Icon icon="search" size="sm" />{/snippet}

<!--
	Both icons are always in the DOM. While the mode is still unresolved
	('system'), a pure CSS prefers-color-scheme query decides which one shows so
	the first paint matches the OS — otherwise the icon starts as the dark-mode
	glyph (the resolved 'light' default) and visibly swaps on a dark-OS machine
	after hydration. Once the mode resolves to a concrete value the class forces
	the icon explicitly; for the OS-following case that matches what the media
	query already showed, so nothing visibly changes.

	The glyphs are docs-local marks rather than registry entries — see
	`moon-icon.svelte` for why this one control does not take a substitution.
-->
{#snippet colorModeIcon()}
	<span
		class="mode-icon"
		class:mode-icon--when-system-dark={themeMode === 'system'}
		class:mode-icon--shown={themeMode !== 'system' && mode === 'light'}
		class:mode-icon--hidden={themeMode !== 'system' && mode !== 'light'}
	>
		<MoonIcon size={16} />
	</span>
	<span
		class="mode-icon"
		class:mode-icon--when-system-light={themeMode === 'system'}
		class:mode-icon--shown={themeMode !== 'system' && mode === 'dark'}
		class:mode-icon--hidden={themeMode !== 'system' && mode !== 'dark'}
	>
		<SunIcon size={16} />
	</span>
{/snippet}

{#snippet communityIcon()}<HeartHandshakeIcon size={16} />{/snippet}

{#snippet githubIcon()}<GithubLogo width={16} height={16} />{/snippet}

{#snippet menuIcon()}<Icon icon="menu" size="sm" />{/snippet}

{#snippet endContent()}
	<HStack gap={2}>
		<HStack gap={0.5}>
			<Button
				label="Search"
				tooltip="Search"
				variant="ghost"
				isIconOnly
				icon={searchIcon}
				onclick={() => (isSearchOpen = true)}
			/>
			<Button
				label={modeLabel}
				tooltip={modeLabel}
				variant="ghost"
				isIconOnly
				icon={colorModeIcon}
				onclick={onToggleMode}
			/>
			<!--
				Upstream's Community button, restored. It was left out while
				`/community` did not exist — `nav-items.ts`'s standing rule is that
				linking to a 404 is worse than not linking — and the page landed in the
				templates/community batch, so the button comes back with it. Same slot
				as upstream's: between the mode toggle and GitHub.
			-->
			<Button
				label="Community"
				tooltip="Community"
				variant="ghost"
				isIconOnly
				icon={communityIcon}
				href="/community"
			/>
			<Button
				label="GitHub"
				tooltip="GitHub"
				variant="ghost"
				isIconOnly
				icon={githubIcon}
				href={REPO_URL}
			/>
		</HStack>
		<Button label="Get started" variant="primary" href={topicHref('getting-started')} />
		{#if !isMobileNavEnabled}
			<div class="mobile-toggle">
				<Button
					label="Open menu"
					tooltip="Menu"
					variant="ghost"
					isIconOnly
					icon={menuIcon}
					onclick={() => (isMenuOpen = true)}
				/>
			</div>
		{/if}
	</HStack>
{/snippet}

{#snippet drawerHeader()}
	<AstryxLogo size={24} isDecorative />
{/snippet}

<TopNav label="Astryx navigation" {heading} {centerContent} {endContent} />

<SearchPalette bind:isOpen={isSearchOpen} />

{#if !isMobileNavEnabled}
	<MobileNav
		isOpen={isMenuOpen}
		onOpenChange={(next) => (isMenuOpen = next)}
		side="end"
		label="Astryx navigation"
		header={drawerHeader}
	>
		<TopNavDrawerScope>
			<div class="drawer-items">{@render navLinks(() => (isMenuOpen = false))}</div>
		</TopNavDrawerScope>
	</MobileNav>
{/if}

<style>
	/* Upstream's MOBILE_BREAKPOINT. */
	.desktop-nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
	}

	.mobile-toggle {
		display: none;
		align-items: center;
	}

	@media (max-width: 768px) {
		.desktop-nav {
			display: none;
		}

		.mobile-toggle {
			display: flex;
		}
	}

	.drawer-items {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-0-5);
	}

	/* See the colorModeIcon snippet. */
	.mode-icon--when-system-dark {
		display: inline-flex;
	}

	.mode-icon--when-system-light {
		display: none;
	}

	@media (prefers-color-scheme: dark) {
		.mode-icon--when-system-dark {
			display: none;
		}

		.mode-icon--when-system-light {
			display: inline-flex;
		}
	}

	.mode-icon--shown {
		display: inline-flex;
	}

	.mode-icon--hidden {
		display: none;
	}
</style>
