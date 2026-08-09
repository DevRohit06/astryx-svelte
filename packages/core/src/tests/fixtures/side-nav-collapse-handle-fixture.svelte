<script lang="ts">
	import SideNav from '$lib/components/side-nav/side-nav.svelte';
	import SideNavCollapseButton from '$lib/components/side-nav/side-nav-collapse-button.svelte';
	import SideNavItem from '$lib/components/side-nav/side-nav-item.svelte';
	import SideNavSection from '$lib/components/side-nav/side-nav-section.svelte';
	import type { SideNavImperativeCollapseHandle } from '$lib/components/side-nav/side-nav-collapse-context.svelte.js';

	/**
	 * Upstream's `Example`: a `SideNavCollapseButton` rendered *outside* the
	 * `SideNav`, wired to it imperatively, with the collapse state controlled.
	 *
	 * `handleRef` has no counterpart — Svelte has no ref objects. `SideNav`
	 * exposes `getCollapseState()` as an instance export reached through
	 * `bind:this`, and `SideNavCollapseButton` takes the handle *object* rather
	 * than a ref to one. The stable box below is what `useRef` buys: it exists
	 * from the first render and its contents fill in at mount, which is what lets
	 * the button render before the sidebar exists (the `isCollapsible` fallback
	 * for a handle whose `getCollapseState()` still returns null is `true`).
	 */
	interface Props {
		/** Consumer `onclick` on the collapse button. */
		onclick?: (event: MouseEvent) => void;
	}

	const { onclick }: Props = $props();

	let isCollapsed = $state(false);
	let nav: ReturnType<typeof SideNav> | undefined = $state();

	const handle: SideNavImperativeCollapseHandle = {
		getCollapseState: () => nav?.getCollapseState() ?? null
	};
</script>

{#snippet stubIcon()}<svg data-testid="stub-icon"></svg>{/snippet}

{#snippet items()}
	<SideNavSection title="Main">
		<SideNavItem label="Dashboard" icon={stubIcon} />
	</SideNavSection>
{/snippet}

<SideNavCollapseButton {handle} {onclick} />
<SideNav
	bind:this={nav}
	collapsible={{
		isCollapsed,
		onCollapsedChange: (next) => (isCollapsed = next),
		hasButton: false
	}}
	children={items}
/>
