<script lang="ts" module>
	/** One item's spec. Everything upstream writes inline on `<CheckboxListItem>`. */
	export interface CheckboxItemConfig {
		label: string;
		value?: string;
		description?: string;
		isDisabled?: boolean;
		isLoading?: boolean;
		isChecked?: boolean | 'indeterminate';
		onCheck?: (checked: boolean) => void;
		onclick?: (event: MouseEvent) => void;
		/** `endContent` — `<span data-testid="end">Badge</span>`. */
		end?: boolean;
		/** `endContent` — a real `<button data-testid="end-btn">Action</button>`. */
		endButton?: boolean;
		/**
		 * Render `label` as a *snippet* — upstream's `<span>Pro plan <em>…</em></span>`
		 * ReactNode label, which cannot name the checkbox on its own.
		 */
		richLabel?: boolean;
		'data-testid'?: string;
		'aria-describedby'?: string;
		'aria-label'?: string;
	}
</script>

<script lang="ts">
	import CheckboxList, {
		type CheckboxListProps
	} from '$lib/components/checkbox-list/checkbox-list.svelte';
	import CheckboxListItem from '$lib/components/checkbox-list/checkbox-list-item.svelte';
	import List from '$lib/components/list/list.svelte';

	/**
	 * `<CheckboxList>` (or, with `standalone`, a plain `<List>`) around the
	 * `<CheckboxListItem>` children upstream writes inline as JSX. A Svelte test
	 * cannot author a snippet, so the items are described by the `items` array and
	 * every group prop is forwarded through `...rest`.
	 *
	 * `value` is **not** committed here: upstream's cases pass a fixed `value` prop
	 * and assert on the `onChange` spy, never re-rendering with the new array. The
	 * port's `syncNativeState` re-assertion is what keeps the DOM matching that
	 * fixed prop after a change event, exactly as React's controlled-input restore
	 * does — so a non-committing fixture is the faithful translation, and the one
	 * that lets the blocked-toggle cases assert `not.toBeChecked()`.
	 */
	interface Props extends Omit<CheckboxListProps, 'children' | 'label'> {
		/** Optional only so `standalone` (a plain `<List>`) needs no group label. */
		label?: string;
		items: CheckboxItemConfig[];
		/** Render the items in a plain `<List>`, i.e. `CheckboxListItem` standalone mode. */
		standalone?: boolean;
	}

	let { label = 'Preferences', items, standalone = false, ...rest }: Props = $props();
</script>

{#snippet itemList()}
	{#each items as item, i (i)}
		{#snippet endContent()}
			{#if item.endButton}
				<button type="button" data-testid="end-btn">Action</button>
			{:else}
				<span data-testid="end">Badge</span>
			{/if}
		{/snippet}
		{#snippet richLabel()}<span>Pro plan <em>(recommended)</em></span>{/snippet}
		<CheckboxListItem
			label={item.richLabel ? richLabel : item.label}
			value={item.value}
			description={item.description}
			isDisabled={item.isDisabled}
			isLoading={item.isLoading}
			isChecked={item.isChecked}
			onCheck={item.onCheck}
			onclick={item.onclick}
			endContent={item.end || item.endButton ? endContent : undefined}
			data-testid={item['data-testid']}
			aria-describedby={item['aria-describedby']}
			aria-label={item['aria-label']}
		/>
	{/each}
{/snippet}

{#if standalone}
	<List>
		{@render itemList()}
	</List>
{:else}
	<CheckboxList {...rest} {label}>
		{@render itemList()}
	</CheckboxList>
{/if}
