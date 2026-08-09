<script lang="ts">
	import type { Component } from 'svelte';

	/**
	 * Renders any component with one snippet slot filled and the rest of its
	 * props passed through.
	 *
	 * React's tests write `icon={<span data-testid="icon">⚙</span>}` inline; a
	 * Svelte snippet can only be authored in a template, so a component is the
	 * smallest thing that can hand one to another component. Naming the slot as
	 * a prop is what keeps this one fixture serving `icon` and `actions` alike.
	 */
	interface Props {
		// `any` rather than a concrete props type: assignability for a component
		// is contravariant in its props, so the only type that accepts *every*
		// component is the one that is assignable to all of them.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		/** Prop name of the snippet slot to fill, e.g. `icon` or `actions`. */
		slot: string;
		/** Text content of the rendered slot. */
		text: string;
		/** `data-testid` on the slot's span, when the case needs to find it. */
		testid?: string;
		/** The target's own props. */
		rest?: Record<string | symbol, unknown>;
	}

	const { component: Target, slot, text, testid, rest = {} }: Props = $props();
</script>

{#snippet content()}
	<span data-testid={testid}>{text}</span>
{/snippet}

<Target {...rest} {...{ [slot]: content }} />
