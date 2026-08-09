<script lang="ts">
	import type { Component } from 'svelte';

	/**
	 * `slot-probe.svelte`, but the slot is filled with an SVG rather than a
	 * `<span>`.
	 *
	 * Upstream passes its shared `TestIcon` component to `*Icon` props and then
	 * asserts on `document.querySelector('svg')`; the `<span>` `slot-probe`
	 * renders would force that assertion to be restated. This renders `TestIcon`'s
	 * markup verbatim as a snippet so it does not have to be.
	 */
	interface Props {
		// `any` for the same reason `slot-probe.svelte` uses it: a component's
		// props are contravariant, so nothing narrower accepts every component.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		/** Prop name of the snippet slot to fill, e.g. `labelIcon`. */
		slot: string;
		/** The target's own props. */
		rest?: Record<string | symbol, unknown>;
	}

	const { component: Target, slot, rest = {} }: Props = $props();
</script>

{#snippet icon()}
	<svg viewBox="0 0 24 24" data-testid="test-icon"><path d="M4 4h16v16H4z" /></svg>
{/snippet}

<Target {...rest} {...{ [slot]: icon }} />
