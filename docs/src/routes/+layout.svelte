<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	// Layer order + `color-scheme`, which every `light-dark()` token depends on.
	import '@astryx-svelte/core/base.css';
	// Every installed theme package's `@scope ([data-astryx-theme="…"])` block.
	// None of these is the site theme, but each is in `THEME_OBJECTS`, and a
	// `__built` theme injects nothing at runtime — so anything that selects one
	// needs its stylesheet already present.
	//
	// **The set is the dependency list, not the reel.** Upstream's
	// `generate-data.mjs` aggregates one `@import "<pkg>/theme.css"` per
	// `@astryxdesign/theme-*` in the docsite's dependencies into a generated
	// `themes.css`, which `globals.css` imports; the reel's curated slide list is
	// a separate, shorter thing. This block is that aggregator, hand-maintained —
	// so it tracks `docs/package.json`, exactly as `THEME_OBJECTS` does.
	import '@astryx-svelte/theme-neutral/theme.css';
	import '@astryx-svelte/theme-matcha/theme.css';
	import '@astryx-svelte/theme-butter/theme.css';
	import '@astryx-svelte/theme-gothic/theme.css';
	import '@astryx-svelte/theme-y2k/theme.css';
	// Installed but not reel slides — the same standing upstream has for Stone,
	// which its docsite depends on and gives no slide. They are here because the
	// rule above is "one import per dependency", and they are last within the
	// upstream group because the five above are the reel's, in its order.
	import '@astryx-svelte/theme-chocolate/theme.css';
	import '@astryx-svelte/theme-stone/theme.css';
	// Local, non-upstream — the reel's one slide that ports nothing. Same rule
	// applies: it is `__built`, so without this import the slide selects a theme
	// whose stylesheet is nowhere in the document and renders untouched.
	import '@astryx-svelte/theme-liquid-glass/theme.css';
	// The docsite's own brand theme, compiled by scripts/build-astryx-theme.mjs,
	// and the site-wide theme applied below. Upstream's globals.css imports its
	// built counterpart the same way.
	import '$lib/generated/astryx-theme.css';
	import { AppShell, Theme } from '@astryx-svelte/core';
	import { page } from '$app/state';
	import './docs.css';
	import './landing.css';
	import { astryxTheme } from '$lib/themes/astryx-theme.js';
	import TopNav from '$lib/shell/top-nav.svelte';
	import SideNav from '$lib/shell/side-nav.svelte';
	import SiteFooter from '$lib/shell/site-footer.svelte';
	import { setColorModeContext, useColorMode } from '$lib/shell/color-mode.svelte.js';

	/**
	 * The site frame — a real `AppShell`, configured as upstream's two route-group
	 * layouts configure theirs.
	 *
	 * Upstream splits this into `app/(site)/layout.tsx` (marketing) and
	 * `app/(docs)/layout.tsx` (docs), both under a root `Providers`. SvelteKit has
	 * no route groups here, so the split is a branch on `page.url.pathname` — the
	 * same reading `sideNav` already needed.
	 *
	 * The configuration decisions:
	 *
	 * - **`variant="surface"`, matching both upstream layouts** (this was
	 *   `"section"` before the landing-page pass). It is what makes the header a
	 *   plain surface for `landing.css`'s frosted-glass rules to paint over; the
	 *   bordered `"section"` look fought them.
	 * - **`height="auto"`, not `fill`.** The page must be what scrolls:
	 *   `Outline`'s scroll-spy resolves headings against the *viewport*, hash
	 *   navigation lands them with `scroll-margin-block-start`, and the landing
	 *   page's pin-and-cover hero reads `window` scroll. Under `fill` the scroll
	 *   container is `LayoutContent` instead and all three would silently stop
	 *   working. `auto` also gives us `--appshell-header-height`, measured from
	 *   the real header.
	 * - **`sideNav` is conditional on the route**, not always supplied. `AppShell`
	 *   treats any snippet as "a sidenav exists", so handing it one that renders
	 *   nothing on `/` would put an empty panel on the home page and, worse, offer
	 *   a mobile drawer with nothing in it.
	 * - **`mobileNav={false}` on the marketing route**, as upstream's `(site)`
	 *   layout passes. With no sidenav there is nothing for `AppShell`'s drawer to
	 *   hold, and `TopNav` renders its own `MobileNav` for the links instead —
	 *   which it only does when `isMobileNavEnabled` is false. Without this the
	 *   two would race to own the overlay.
	 *
	 * **`astryxTheme` is the site-wide theme**, which is what upstream's root
	 * `Providers` does — it wraps the whole docsite, marketing and documentation
	 * alike. The consequence is upstream's too, and worth stating plainly: every
	 * component example renders in the Astryx brand (pill buttons, a near-black
	 * accent) rather than in the neutral theme's own colours. `neutralTheme` is
	 * still imported, and its stylesheet with it, because the hero reel's registry
	 * lists it as an installed theme package.
	 *
	 * Below `md` the docs routes collapse to one drawer: `TopNav` renders in
	 * `mobile-bar` mode with a hamburger, and `AppShell` hands it the `SideNav` as
	 * drawer content so the two navs share a single overlay rather than opening
	 * two. None of that is wired here; it is what the render-mode contexts do.
	 *
	 * The footer is inside `children` rather than `Layout`'s `footer` slot: it
	 * scrolls away with the page, which is what a docs site wants and what
	 * upstream's own layouts do.
	 */
	let { children } = $props();

	// Created once, here, and published to the tree. `useColorMode()` is a
	// factory — calling it again anywhere else would build a second, unrelated
	// preference, and the two would drift apart the moment either was toggled.
	const colorMode = useColorMode();
	setColorModeContext(colorMode);

	const pathname = $derived(page.url.pathname);
	// The routes whose sidebar `docs-shell.svelte` used to own. Anything else —
	// the home page, the gallery — gets no side panel and no drawer.
	const hasSidebar = $derived(pathname.startsWith('/docs') || pathname.startsWith('/components'));
	// Upstream's `(site)` route group — the landing page plus the two galleries
	// that are not documentation. `/community` is not here: it is Meta's Discord
	// and social accounts, which this port does not have (see `site-footer`).
	const isMarketing = $derived(
		pathname === '/' || pathname.startsWith('/templates') || pathname.startsWith('/themes')
	);

	// In dev, StyleX serves its compiled CSS from a virtual module rather than a
	// real asset, so it has to be injected by hand; the production build appends
	// it to a normal CSS asset. `import.meta.env.DEV` is statically replaced by
	// Vite, so this whole branch is stripped from the production bundle.
	if (import.meta.env.DEV) {
		import('virtual:stylex:runtime');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!--
		No font <link> here. `app.html` requests all fourteen families in one
		stylesheet, Figtree included with this same axis spec, and carries both
		preconnects — which is upstream's shape (`layout.tsx` has exactly one link).
		This block used to request Figtree separately, justified by a comment saying
		it was "the only one of those this port has"; that stopped being true when
		the reel themes landed and the duplication was left behind, costing a
		redundant third-party round trip for a face already being fetched.
	-->
	{#if import.meta.env.DEV}
		<link rel="stylesheet" href="/virtual:stylex.css" />
	{/if}
</svelte:head>

{#snippet topNav()}
	<TopNav mode={colorMode.mode} themeMode={colorMode.themeMode} onToggleMode={colorMode.toggle} />
{/snippet}

{#snippet sideNav()}
	<SideNav />
{/snippet}

<Theme theme={astryxTheme} mode={colorMode.themeMode}>
	<div class="app">
		<AppShell
			variant="surface"
			height="auto"
			{topNav}
			sideNav={hasSidebar ? sideNav : undefined}
			mobileNav={isMarketing ? false : undefined}
		>
			<!--
				Upstream's (site) layout wraps children + footer in a flex column that
				is at least a viewport tall, so a short marketing page still pins its
				footer to the bottom, and gives the footer its own stacking context
				above the hero's fixed layers. layout.module.css's .shell/.main/.footer.
			-->
			<div class="shell">
				<div class="main">{@render children()}</div>
				<div class="footer"><SiteFooter /></div>
			</div>
		</AppShell>
	</div>
</Theme>

<style>
	.app {
		min-height: 100vh;
		background: var(--color-background-body);
		color: var(--color-text-primary);
	}

	/* Upstream's app/(site)/layout.module.css, applied on every route: the docs
	   group wants the same "footer sits at the bottom of a short page" behaviour,
	   and the z-index is what keeps the footer above the landing hero's
	   position:fixed layers. */
	.shell {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--appshell-header-height, 64px));
		width: 100%;
	}

	.main {
		flex: 1 0 auto;
		width: 100%;
	}

	.footer {
		position: relative;
		z-index: 1;
		background-color: var(--color-background-surface);
	}
</style>
