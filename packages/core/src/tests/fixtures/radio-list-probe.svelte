<script lang="ts" module>
	export interface RadioItemConfig {
		label: string;
		value: string;
		isDisabled?: boolean;
		description?: string;
		/** Render a `startContent` snippet exposing `data-testid="start"`. */
		start?: boolean;
		/** Render an `endContent` snippet exposing `data-testid="end"`. */
		end?: boolean;
		/** Rest props forwarded onto the item root (the rest-forwarding case). */
		'data-testid'?: string;
		id?: string;
		'aria-label'?: string;
	}
</script>

<script lang="ts">
	import RadioList, { type RadioListProps } from '$lib/components/radio-list/radio-list.svelte';
	import RadioListItem from '$lib/components/radio-list/radio-list-item.svelte';

	/**
	 * A `RadioList` around `RadioListItem` children upstream writes inline as JSX.
	 * A Svelte test cannot author a snippet, so the items are described by the
	 * `items` array and every `RadioList` prop is forwarded through `...rest`.
	 *
	 * `value` is controlled here exactly as upstream's (`value` + `onChange`, not
	 * `bind:`): the fixture holds it in its own `$state`, commits the selection on
	 * change so the DOM reflects it, and still forwards each call to the `onChange`
	 * spy a case may pass. The blocked-selection path never calls `onChange`, so it
	 * never commits — matching the component's guard.
	 *
	 * `form`/`before`/`after` add the surrounding markup upstream writes as JSX
	 * siblings of the group: a `<form>` wrapper for the form-participation cases and
	 * `before`/`after` `<button>`s for the focus-entry cases.
	 */
	interface Props extends Omit<RadioListProps, 'children' | 'value' | 'onChange'> {
		value?: string;
		onChange?: (value: string) => void;
		items: RadioItemConfig[];
		form?: boolean;
		before?: boolean;
		after?: boolean;
	}

	let {
		value: initialValue = '',
		onChange,
		items,
		form = false,
		before = false,
		after = false,
		...rest
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initialValue);

	function handleChange(v: string): void {
		value = v;
		onChange?.(v);
	}
</script>

{#snippet startContent()}
	<span data-testid="start">★</span>
{/snippet}

{#snippet endContent()}
	<span data-testid="end">Badge</span>
{/snippet}

{#snippet group()}
	<RadioList {...rest} {value} onChange={handleChange}>
		{#each items as item, i (i)}
			<RadioListItem
				label={item.label}
				value={item.value}
				isDisabled={item.isDisabled}
				description={item.description}
				startContent={item.start ? startContent : undefined}
				endContent={item.end ? endContent : undefined}
				data-testid={item['data-testid']}
				id={item.id}
				aria-label={item['aria-label']}
			/>
		{/each}
	</RadioList>
{/snippet}

{#if form}
	<form>
		{@render group()}
	</form>
{:else}
	{#if before}<button type="button">before</button>{/if}
	{@render group()}
	{#if after}<button type="button">after</button>{/if}
{/if}
