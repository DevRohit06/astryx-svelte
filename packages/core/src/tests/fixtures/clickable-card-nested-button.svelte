<script lang="ts">
	import ClickableCard from '$lib/components/clickable-card/clickable-card.svelte';

	/**
	 * Stands in for upstream's inline
	 * `<ClickableCard onClick={...}><button onClick={...}>Nested</button></ClickableCard>`.
	 *
	 * A Svelte snippet can only be authored in a template, so a nested interactive
	 * `<button>` (with its own handler) needs a fixture rather than the shared
	 * `slot-probe`, whose slot is a plain `<span>`. The card's own onclick and the
	 * nested button's onclick are passed in so the case can spy on each.
	 */
	const {
		onCardClick,
		onButtonClick
	}: { onCardClick: (event: MouseEvent) => void; onButtonClick: (event: MouseEvent) => void } =
		$props();
</script>

<ClickableCard label="Test card" onclick={onCardClick}>
	<button type="button" onclick={onButtonClick}>Nested</button>
</ClickableCard>
