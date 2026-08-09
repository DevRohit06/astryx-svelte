<script lang="ts" module>
	export type { SideNavItemSpec } from './side-nav-item-node.svelte';
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import {
		setAppShellMobileContext,
		type AppShellMobileContextValue
	} from '$lib/components/app-shell/app-shell-mobile-context.svelte.js';
	import LinkProvider from '$lib/components/link/link-provider.svelte';
	import SideNavCollapseScope from '$lib/components/side-nav/side-nav-collapse-scope.svelte';
	import SideNavRenderScope from '$lib/components/side-nav/side-nav-render-scope.svelte';
	import type { SideNavRenderMode } from '$lib/components/side-nav/side-nav-render-context.svelte.js';
	// Aliased on purpose: the module script above re-exports the same name, and
	// two bindings for one name inside a single component make the svelte-eslint
	// parser read the re-export as an assignment to an import (`no-import-assign`).
	import Node, { type SideNavItemSpec as ItemSpec } from './side-nav-item-node.svelte';

	/**
	 * A `SideNavItem` tree wrapped in whichever providers a case needs.
	 *
	 * Each wrapper stands in for a JSX provider element upstream writes inline:
	 *
	 * - `collapse` → upstream's `renderCollapsed` / `renderExpanded` helpers, which
	 *   wrap in `<SideNavCollapseContext value={{isCollapsed, toggle, isCollapsible}}>`.
	 *   Svelte reads context at component init, so scoping needs a component
	 *   boundary: `SideNavCollapseScope` is that boundary.
	 * - `renderMode` → `<SideNavRenderContext value="drawer">`, via
	 *   `SideNavRenderScope`.
	 * - `mobile` → `<AppShellMobileContext value={…}>`. Set here at init rather
	 *   than through a wrapper component, since it must be published above
	 *   everything else the fixture renders.
	 * - `provider` → `<LinkProvider component={CustomLink}>`.
	 */
	interface Props {
		item: ItemSpec;
		/** Publishes a collapsed / expanded `SideNavCollapseContext`. */
		collapse?: 'collapsed' | 'expanded';
		/** Publishes a `SideNavRenderContext`. */
		renderMode?: SideNavRenderMode;
		/** Publishes an `AppShellMobileContext`. */
		mobile?: AppShellMobileContextValue;
		/** Publishes a `LinkProvider` around the item. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider?: Component<any>;
	}

	const { item, collapse, renderMode, mobile, provider }: Props = $props();

	// Read inside the getter so the context tracks the prop rather than freezing;
	// whether the provider exists at all is the init-time decision, which is what
	// upstream's presence-or-absence of the provider element expresses.
	// svelte-ignore state_referenced_locally
	if (mobile) {
		setAppShellMobileContext(() => mobile);
	}

	const collapseState = $derived({
		isCollapsed: collapse === 'collapsed',
		toggle: () => {},
		isCollapsible: true
	});
</script>

{#snippet node()}<Node spec={item} />{/snippet}

{#snippet linked()}
	{#if provider}
		<LinkProvider component={provider}>{@render node()}</LinkProvider>
	{:else}
		{@render node()}
	{/if}
{/snippet}

{#snippet moded()}
	{#if renderMode}
		<SideNavRenderScope mode={renderMode}>{@render linked()}</SideNavRenderScope>
	{:else}
		{@render linked()}
	{/if}
{/snippet}

{#if collapse}
	<SideNavCollapseScope state={collapseState}>{@render moded()}</SideNavCollapseScope>
{:else}
	{@render moded()}
{/if}
