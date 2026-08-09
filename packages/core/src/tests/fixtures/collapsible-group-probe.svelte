<script lang="ts" module>
	import type { CollapsibleGroupProps } from '$lib/components/collapsible/collapsible-group.svelte';

	export interface GroupItemConfig {
		/** Coordination value (each item needs one to participate). */
		value?: string;
		/** Trigger text. */
		trigger: string;
		/** Body text, placed inside the content region. */
		body: string;
		isDisabled?: boolean;
		/** Rest prop forwarded onto the item root (the data-testid / data-density cases). */
		'data-testid'?: string;
		/** Render an `<hr data-testid="separator">` after this item (interleaved-children case). */
		separatorAfter?: boolean;
	}

	export interface CollapsibleGroupProbeProps extends Omit<CollapsibleGroupProps, 'children'> {
		items: GroupItemConfig[];
	}
</script>

<script lang="ts">
	import CollapsibleGroup from '$lib/components/collapsible/collapsible-group.svelte';
	import Collapsible from '$lib/components/collapsible/collapsible.svelte';

	/**
	 * A `CollapsibleGroup` around `Collapsible` children, which upstream writes
	 * inline as JSX. The items are described by the `items` array and every group
	 * prop is forwarded through `...rest` (`type`, `defaultValue`, `value`,
	 * `onChange`, `hasDividers`, `density`, `class`, `data-testid`, and an
	 * attachment key).
	 *
	 * Controlled-group cases pass `value` as a plain prop with an `onChange` spy that
	 * does not commit — exactly upstream's controlled group — and drive the change
	 * with `rerender` (upstream's `rerender`). `separatorAfter` inserts the `<hr>`
	 * upstream writes as a JSX sibling for the interleaved-children case.
	 */
	let { items, ...rest }: CollapsibleGroupProbeProps = $props();
</script>

<CollapsibleGroup {...rest}>
	{#each items as item, i (i)}
		<Collapsible
			trigger={item.trigger}
			value={item.value}
			isDisabled={item.isDisabled}
			data-testid={item['data-testid']}
		>
			<p>{item.body}</p>
		</Collapsible>
		{#if item.separatorAfter}<hr data-testid="separator" />{/if}
	{/each}
</CollapsibleGroup>
