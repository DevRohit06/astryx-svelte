<script lang="ts">
	import { useFocusTrap } from '$lib/hooks/use-focus-trap.svelte.js';
	import NestedInnerTrap from './nested-inner-trap.svelte';

	/**
	 * Upstream's `NestedTraps`: an outer trap whose DOM subtree contains an inner
	 * one, both activating in the same flush.
	 *
	 * The hazard the fixture exists to reproduce is real here for the same reason
	 * it is upstream, by a different mechanism — Svelte runs child effects before
	 * parent effects too, so the *inner* trap pushes onto the Escape stack first
	 * and a pure last-pushed comparison would hand Escape to the outer one.
	 */
	const {
		onOuterEscape,
		onInnerEscape,
		showInner = true
	}: {
		onOuterEscape: () => void;
		onInnerEscape: () => void;
		showInner?: boolean;
	} = $props();

	const trap = useFocusTrap(() => ({ isActive: true, onEscape: onOuterEscape }));
</script>

<div {@attach trap.attachContainer} data-testid="nested-outer">
	<button type="button">outer-btn</button>
	{#if showInner}
		<NestedInnerTrap onEscape={onInnerEscape} />
	{/if}
</div>
