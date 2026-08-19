<script lang="ts">
	import type { Component } from 'svelte';
	import LinkProvider from '$lib/components/link/link-provider.svelte';
	import SideNavCollapseScope from '$lib/components/side-nav/side-nav-collapse-scope.svelte';
	import SideNavHeading, {
		type SideNavHeadingProps
	} from '$lib/components/side-nav/side-nav-heading.svelte';

	/**
	 * `<SideNavHeading>` with its three snippet slots filled from data, optionally
	 * inside a collapsed `SideNavCollapseContext` or a `LinkProvider`.
	 *
	 * `collapsed` is upstream's `CollapsedWrapper` — `<SideNavCollapseContext
	 * value={{isCollapsed: true, toggle: () => {}, isCollapsible: true}}>`. Svelte
	 * reads context at init, so scoping it needs a component boundary, which is
	 * what `SideNavCollapseScope` is.
	 */
	interface Props {
		/** Props spread onto `<SideNavHeading>`. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		/** Fills `icon` with `<span data-testid={testid}>{text}</span>`. */
		icon?: { text: string; testid?: string };
		/** Fills `menu` with `<div>{menu}</div>` — upstream's `menu={<div>Menu</div>}`. */
		menu?: string;
		/**
		 * Fills `menu` with one `<div role="menuitem">` per entry — upstream's
		 * `menuItems` fragment in its `menu popover semantics` block. Takes
		 * precedence over `menu` when both are given, which no case does.
		 */
		menuItems?: string[];
		/** Gives each `menuItems` entry `tabindex="-1"`, so focus can land on it. */
		menuItemsFocusable?: boolean;
		/** Fills `headerEndContent` with `<span data-testid={testid}>{text}</span>`. */
		headerEndContent?: { text: string; testid?: string };
		/** Publishes a collapsed `SideNavCollapseContext` around the heading. */
		collapsed?: boolean;
		/** Publishes a `LinkProvider` around the heading. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider?: Component<any>;
	}

	const {
		props = {},
		icon,
		menu,
		menuItems,
		menuItemsFocusable = false,
		headerEndContent,
		collapsed = false,
		provider
	}: Props = $props();

	const collapsedState = { isCollapsed: true, toggle: () => {}, isCollapsible: true };
</script>

{#snippet iconSlot()}<span data-testid={icon?.testid}>{icon?.text}</span>{/snippet}
{#snippet menuSlot()}<div>{menu}</div>{/snippet}
{#snippet menuItemsSlot()}
	{#each menuItems ?? [] as label (label)}
		<!--
			`tabindex` mirrors upstream, which uses two different `menuItems`
			fragments: bare `<div role="menuitem">` for the popover-semantics cases
			and `tabIndex={-1}` for the hover-guard ones, where focus has to land on
			an item. A `<div>` with no tabindex is not focusable, so without it the
			focus assertions would be vacuous.
		-->
		<div role="menuitem" tabindex={menuItemsFocusable ? -1 : undefined}>{label}</div>
	{/each}
{/snippet}
{#snippet endSlot()}<span data-testid={headerEndContent?.testid}>{headerEndContent?.text}</span
	>{/snippet}

{#snippet heading()}
	<SideNavHeading
		{...props as SideNavHeadingProps}
		icon={icon ? iconSlot : undefined}
		menu={menuItems != null ? menuItemsSlot : menu != null ? menuSlot : undefined}
		headerEndContent={headerEndContent ? endSlot : undefined}
	/>
{/snippet}

{#snippet linked()}
	{#if provider}
		<LinkProvider component={provider}>{@render heading()}</LinkProvider>
	{:else}
		{@render heading()}
	{/if}
{/snippet}

{#if collapsed}
	<SideNavCollapseScope state={collapsedState}>{@render linked()}</SideNavCollapseScope>
{:else}
	{@render linked()}
{/if}
