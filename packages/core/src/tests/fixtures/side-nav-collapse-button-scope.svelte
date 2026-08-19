<script lang="ts">
	import SideNavCollapseButton from '$lib/components/side-nav/side-nav-collapse-button.svelte';
	import SideNavCollapseScope from '$lib/components/side-nav/side-nav-collapse-scope.svelte';

	/**
	 * Upstream's `renderExpanded(<SideNavCollapseButton … />)` — the button on its
	 * own inside a `SideNavCollapseContext`, with no `SideNav` around it.
	 *
	 * `side-nav-collapse-handle-fixture` is the *imperative* wiring (a button
	 * outside a real sidebar, joined by a handle); this is the context-only shape
	 * the size and chevron cases need, where there is no sidebar at all.
	 */
	interface Props {
		isCollapsed?: boolean;
		/** Props spread onto the button — `size`, `data-testid`. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		buttonProps?: Record<string, any>;
	}

	const { isCollapsed = false, buttonProps = {} }: Props = $props();

	const state = $derived({ isCollapsed, toggle: () => {}, isCollapsible: true });
</script>

<SideNavCollapseScope {state}>
	<SideNavCollapseButton {...buttonProps} />
</SideNavCollapseScope>
