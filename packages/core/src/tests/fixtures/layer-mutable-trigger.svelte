<script lang="ts">
	import Tooltip from '$lib/components/tooltip/tooltip.svelte';

	/**
	 * A tooltip trigger whose `style` and `aria-describedby` are owned by *this*
	 * template and change over time — the shape `Slider`'s thumb has.
	 *
	 * `style` is written as an interpolated attribute (not a `style:` directive)
	 * deliberately: that is the spelling Svelte applies by assigning `cssText`,
	 * which is what makes it collide with the anchor name `useLayer.attachTrigger`
	 * writes into the same inline style.
	 */
	let { left = '0px', describedBy = undefined }: { left?: string; describedBy?: string } = $props();
</script>

<span id="own-description">Field description</span>
<span id="other-description">Status message</span>

<Tooltip content="Tooltip text">
	<button type="button" style="left: {left}" aria-describedby={describedBy}>Trigger</button>
</Tooltip>
