<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TopNavSlot } from './top-nav-context.svelte.js';

	export interface TopNavSlotScopeProps {
		/** Which slot the wrapped subtree belongs to. */
		slot: TopNavSlot;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setTopNavSlot } from './top-nav-context.svelte.js';

	/**
	 * Internal — publishes `TopNavSlotContext` to a subtree.
	 *
	 * React scopes a context to part of a tree by wrapping that part in
	 * `<TopNavSlotContext value="start">`. Svelte sets context at *component*
	 * init, so scoping needs a component boundary: this is that boundary, and
	 * nothing more. It renders no element of its own, so the DOM is unchanged.
	 *
	 * Not exported — `TopNav` is its only consumer, and upstream has no
	 * counterpart component for it to be named after.
	 */
	let { slot, children }: TopNavSlotScopeProps = $props();

	setTopNavSlot(() => slot);
</script>

{@render children()}
