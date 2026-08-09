<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';

	/**
	 * `HoverCard`'s counterpart to `tooltip-trigger-swap.svelte`; see that file for
	 * why the `{#if}` sits inside the children snippet and why the swap is driven
	 * by the fixture's own state rather than by `rerender`.
	 *
	 * `hover-card-fixture.svelte` already has a `trigger` prop with the same two
	 * values, but it selects between three whole `<HoverCard>` elements, so
	 * flipping it remounts the component — which is precisely the case that cannot
	 * detect this bug.
	 */
	interface Props {
		contentText?: string;
		delay?: number;
		onOpenChange?: (isOpen: boolean) => void;
	}

	const { contentText = 'Card content', delay = 0, onOpenChange }: Props = $props();

	let swapped = $state(false);

	/** Replace the `<button>` trigger with an `<a>`. */
	export function swap(): void {
		swapped = true;
	}
</script>

{#snippet content()}<span>{contentText}</span>{/snippet}

<HoverCard {content} {delay} {onOpenChange}>
	{#if swapped}<a href="#swapped" data-testid="link-trigger">Link trigger</a>{:else}<button
			type="button"
			data-testid="button-trigger">Button trigger</button
		>{/if}
</HoverCard>
