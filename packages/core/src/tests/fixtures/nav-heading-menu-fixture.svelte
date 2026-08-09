<script lang="ts">
	import NavHeadingMenu from '$lib/components/nav-menu/nav-heading-menu.svelte';
	import NavHeadingMenuItem from '$lib/components/nav-menu/nav-heading-menu-item.svelte';
	import { setNavHeadingCloseContext } from '$lib/components/nav-menu/nav-menu-context.svelte.js';
	import type { NavHeadingMenuItemProps } from '$lib/components/nav-menu/nav-heading-menu-item.svelte';

	/**
	 * `<NavHeadingMenu>` with `<NavHeadingMenuItem>` children, driven by data.
	 *
	 * Upstream's cases write the items as JSX children; a Svelte snippet can only
	 * be authored in a template, so the items become a spec array and this fixture
	 * turns each entry back into markup.
	 *
	 * `closeMenu` stands in for upstream's `wrapper: <NavHeadingCloseContext
	 * value={{closeMenu}}>` — the parent nav heading popover (`SideNavHeading` /
	 * `TopNavHeading`, both unported) is what writes that context in real use.
	 *
	 * `item` (singular) renders one item *without* a `<NavHeadingMenu>` around it,
	 * for the no-context fallback.
	 */
	interface Props {
		/** Props for the `<NavHeadingMenu>` itself. */
		menu?: Record<string, unknown>;
		items?: NavHeadingMenuItemProps[];
		/** A bare item, rendered with no menu container. */
		item?: NavHeadingMenuItemProps;
		/** Provided as `NavHeadingCloseContext` above the menu. */
		closeMenu?: () => void;
	}

	const { menu = {}, items = [], item, closeMenu }: Props = $props();

	// Read inside the getter, so the context tracks the prop rather than freezing
	// at init — the port's context convention. `hasCloseContext` is the init-time
	// decision (a popover either wraps this menu or it does not), which is what
	// upstream's presence-or-absence of the provider element expresses.
	// svelte-ignore state_referenced_locally
	const hasCloseContext = closeMenu != null;
	if (hasCloseContext) {
		setNavHeadingCloseContext(() => ({ closeMenu: closeMenu ?? (() => {}) }));
	}
</script>

{#if item}
	<NavHeadingMenuItem {...item} />
{:else}
	<NavHeadingMenu {...menu}>
		{#each items as entry, i (i)}
			<NavHeadingMenuItem {...entry} />
		{/each}
	</NavHeadingMenu>
{/if}
