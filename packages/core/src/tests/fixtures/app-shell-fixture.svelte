<script lang="ts">
	import AppShell, { type AppShellProps } from '$lib/components/app-shell/app-shell.svelte';
	import MobileNav from '$lib/components/mobile-nav/mobile-nav.svelte';
	import SideNav from '$lib/components/side-nav/side-nav.svelte';
	import SideNavItem from '$lib/components/side-nav/side-nav-item.svelte';
	import SideNavSection from '$lib/components/side-nav/side-nav-section.svelte';
	import TopNav from '$lib/components/top-nav/top-nav.svelte';
	import TopNavHeading from '$lib/components/top-nav/top-nav-heading.svelte';
	import TopNavItem from '$lib/components/top-nav/top-nav-item.svelte';

	/**
	 * The harness for `AppShell.test.tsx`, and for `MobileNavReopen.test.tsx`'s
	 * `TestShell`.
	 *
	 * Upstream writes each slot inline as JSX. Here every slot is a `Snippet`, and
	 * a snippet can only be authored in a template — so the shapes upstream's
	 * cases pass are enumerated as string discriminators, the same move
	 * `dialog-probe.svelte` makes with its `body` prop.
	 *
	 * `sideNav: 'omitted'` renders an `<AppShell>` with **no `sideNav` attribute at
	 * all**, so upstream's pair of cases — "explicitly undefined" and "omitted
	 * entirely" — stay two distinguishable renders rather than collapsing into one.
	 */

	interface MobileNavSlot {
		isOpen: boolean;
		header?: string;
		'data-testid'?: string;
		onOpenChange?: (open: boolean) => void;
		text?: string;
	}

	interface Props {
		/**
		 * Props spread onto `<AppShell>`: `variant`, `height`, `contentPadding`,
		 * `data-testid`, a `mobileNav` config object, an attachment key.
		 * `Record<string, any>` for the same contravariance reason the other shared
		 * probes give.
		 */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		/** Text of the `<div>` rendered as the main content. */
		content?: string;
		/** Which `topNav` shape to render. */
		topNav?: 'none' | 'div' | 'heading-only' | 'with-item';
		/** Text of the bare-`div` topNav. */
		topNavText?: string;
		/** `data-testid` of the bare-`div` topNav. */
		topNavTestId?: string;
		/** Which `sideNav` shape to render. */
		sideNav?: 'none' | 'omitted' | 'test' | 'div' | 'two-items';
		/** `SideNavItem` label inside the `test` sideNav — upstream's `TestSideNav`. */
		sideNavLabel?: string;
		/** Text of the `<div>` rendered into the banner slot; omitted → no banner. */
		banner?: string;
		/** Config for an explicit `<MobileNav>` passed as the `mobileNav` snippet. */
		mobileNav?: MobileNavSlot | false;
	}

	const {
		props = {},
		content = 'Content',
		topNav = 'none',
		topNavText = 'Nav',
		topNavTestId,
		sideNav = 'none',
		sideNavLabel = 'Nav',
		banner,
		mobileNav = false
	}: Props = $props();

	const explicitMobileNav = $derived(mobileNav === false ? null : mobileNav);
	const noop = (): void => {};
</script>

{#snippet mainContent()}
	<div>{content}</div>
{/snippet}

{#snippet bannerSlot()}
	<div>{banner}</div>
{/snippet}

{#snippet appHeading()}
	<TopNavHeading heading="My App" />
{/snippet}

{#snippet shortHeading()}
	<TopNavHeading heading="App" />
{/snippet}

{#snippet topNavSlot()}
	{#if topNav === 'div'}
		<div data-testid={topNavTestId}>{topNavText}</div>
	{:else if topNav === 'heading-only'}
		<TopNav label="Main navigation" heading={appHeading} />
	{:else if topNav === 'with-item'}
		<TopNav label="Navigation" heading={shortHeading}>
			<TopNavItem label="Home" href="/" />
		</TopNav>
	{/if}
{/snippet}

<!-- Upstream's `TestSideNav` helper, plus the two inline shapes its cases use. -->
{#snippet sideNavSlot()}
	{#if sideNav === 'test'}
		<SideNav>
			<SideNavSection title="Test" isHeaderHidden>
				<SideNavItem label={sideNavLabel} />
			</SideNavSection>
		</SideNav>
	{:else if sideNav === 'div'}
		<div data-testid="sidenav">Side</div>
	{:else if sideNav === 'two-items'}
		<SideNav>
			<SideNavItem label="Dashboard" href="/" isSelected />
			<SideNavItem label="Settings" href="/settings" />
		</SideNav>
	{/if}
{/snippet}

{#snippet mobileNavSlot()}
	{#if explicitMobileNav}
		<MobileNav
			isOpen={explicitMobileNav.isOpen}
			onOpenChange={explicitMobileNav.onOpenChange ?? noop}
			header={explicitMobileNav.header}
			data-testid={explicitMobileNav['data-testid']}
		>
			<div>{explicitMobileNav.text ?? 'Mobile Nav'}</div>
		</MobileNav>
	{/if}
{/snippet}

{#if sideNav === 'omitted'}
	<AppShell
		{...props as Partial<AppShellProps>}
		banner={banner != null ? bannerSlot : undefined}
		topNav={topNav === 'none' ? undefined : topNavSlot}
		mobileNav={explicitMobileNav ? mobileNavSlot : props.mobileNav}
		children={mainContent}
	/>
{:else}
	<AppShell
		{...props as Partial<AppShellProps>}
		banner={banner != null ? bannerSlot : undefined}
		topNav={topNav === 'none' ? undefined : topNavSlot}
		sideNav={sideNav === 'none' ? undefined : sideNavSlot}
		mobileNav={explicitMobileNav ? mobileNavSlot : props.mobileNav}
		children={mainContent}
	/>
{/if}
