<script lang="ts">
	import Item from '$lib/components/item/item.svelte';

	/**
	 * Upstream's `DelegatingItem` helper from `Item.test.tsx`.
	 *
	 * `Item` in delegation mode: `interactiveRef` points at a nested control that
	 * owns the row's keyboard access and action. The row is an enlarged tap target
	 * that forwards surface clicks to that control (`useClickableContainer`).
	 *
	 * Upstream holds the control in a `useRef` and passes the ref object; this port
	 * takes a getter, so the element comes from `bind:this` and is handed over as
	 * `() => checkbox`.
	 */
	const {
		onToggle,
		onclick,
		href
	}: {
		onToggle?: () => void;
		/** Set together with `interactiveRef` to exercise the ignored-`onclick` case. */
		onclick?: (event: MouseEvent) => void;
		/** Set together with `interactiveRef` to exercise the ignored-`href` case. */
		href?: string;
	} = $props();

	let checkbox = $state<HTMLInputElement | null>(null);
</script>

{#snippet startContent()}
	<input bind:this={checkbox} type="checkbox" aria-label="Pick row" onchange={onToggle} />
{/snippet}

<Item label="Row" interactiveRef={() => checkbox} {onclick} {href} {startContent} />
