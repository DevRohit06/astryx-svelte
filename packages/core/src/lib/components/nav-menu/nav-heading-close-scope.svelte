<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface NavHeadingCloseScopeProps {
		/** Dismisses the enclosing heading popover. */
		closeMenu: () => void;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setNavHeadingCloseContext } from './nav-menu-context.svelte.js';

	/**
	 * Internal — publishes `NavHeadingCloseContext` to a subtree.
	 *
	 * The component boundary Svelte needs where React writes
	 * `<NavHeadingCloseContext value={closeMenuCtx}>`. Renders no element of its
	 * own.
	 *
	 * It exists rather than a plain `setNavHeadingCloseContext()` call at
	 * component init because **the scope is load-bearing and asymmetric
	 * upstream**: `SideNavHeading` wraps only its *collapsed* menu, and
	 * `TopNavHeading` wraps only the menu inside its two popover branches. Setting
	 * the context at init would give it to every branch and to the `logo` /
	 * `headerEndContent` slots as well — more than upstream provides, which for a
	 * context whose whole payload is "dismiss the popover you are inside" would be
	 * wrong rather than merely generous.
	 *
	 * Not exported: upstream's public seam is `NavHeadingCloseContext` itself,
	 * which `NavMenu/index.ts` publishes and this port already does.
	 */
	let { closeMenu, children }: NavHeadingCloseScopeProps = $props();

	setNavHeadingCloseContext(() => ({ closeMenu }));
</script>

{@render children()}
