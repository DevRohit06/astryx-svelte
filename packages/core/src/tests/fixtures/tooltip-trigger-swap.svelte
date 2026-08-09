<script lang="ts">
	import Tooltip from '$lib/components/tooltip/tooltip.svelte';

	/**
	 * A `Tooltip` whose trigger element is *replaced* rather than re-rendered:
	 * `{#if}` inside the children snippet swaps a `<button>` for an `<a>`.
	 *
	 * Two things about the shape are load-bearing, and getting either wrong makes
	 * the regression cases vacuous.
	 *
	 * **The `{#if}` is inside the snippet, not around the `<Tooltip>`.** A branch
	 * around the component would remount it, so the wiring would re-run for
	 * trivial reasons. Here the `display: contents` wrapper, the hook and the
	 * layer all survive; only `wrapper.firstElementChild` changes.
	 *
	 * **The swap is driven by the fixture's own `$state`, exposed as an instance
	 * export, rather than by a prop the test flips with `rerender`.** `rerender`
	 * cannot reproduce the bug: `@testing-library/svelte-core` backs its props with
	 * a single `$state.raw` object read through a Proxy, so *every* prop read
	 * anywhere below registers a dependency on that one signal. `useTooltip` reads
	 * the whole options object to compute `layer.id`, and the wiring effect reads
	 * `layer.id` — so a `rerender` of any prop at all invalidates it and the old,
	 * broken implementation re-wires by accident. `swapped` is invisible to
	 * `Tooltip`'s dependency graph, which is exactly the situation the observer
	 * exists for.
	 */
	interface Props {
		content?: string;
		delay?: number;
		onOpenChange?: (isOpen: boolean) => void;
	}

	const { content = 'Tooltip text', delay = 0, onOpenChange }: Props = $props();

	let swapped = $state(false);

	/** Replace the `<button>` trigger with an `<a>`. `renderHook`'s handler form. */
	export function swap(): void {
		swapped = true;
	}
</script>

<Tooltip {content} {delay} {onOpenChange}>
	{#if swapped}<a href="#swapped" data-testid="link-trigger">Link trigger</a>{:else}<button
			type="button"
			data-testid="button-trigger">Button trigger</button
		>{/if}
</Tooltip>
