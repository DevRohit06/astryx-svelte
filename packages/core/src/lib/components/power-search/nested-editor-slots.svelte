<script lang="ts" module>
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import Selector from '../selector/selector.svelte';
	import { unwrapSlotArg } from '../../internal/bind-snippet.js';
	import {
		editPopoverNestedRootLabelAttrs,
		editPopoverOperatorSelectorAttrs
	} from './power-search-edit-popover.stylex.js';
	import NestedSubFilterRow from './nested-sub-filter-row.svelte';
	import type { EditablePartialFilter } from './editable-filter.js';
	import type { InternalConfig } from './use-internal-config.svelte.js';

	/**
	 * The three pieces of markup `NestedEditor` puts into `TreeListItemData`
	 * slots, authored as **module-scope parameterised snippets** so
	 * `createSlotBinder` can bind them per tree node.
	 *
	 * This is the batch-13 mechanism, and it is here for the same reason: a
	 * `TreeListItemData.label`/`endContent` is a zero-parameter `Snippet`, the
	 * data each node needs (its sub-filter and its handlers) exists only while
	 * `buildTreeItems` recurses, and a snippet cannot be authored anywhere but a
	 * `.svelte` file. Upstream closes over all of it with JSX; here the closure
	 * travels as the bound argument instead.
	 *
	 * Each body reads its parameter through `unwrapSlotArg` — the client passes
	 * the resolved value and the server passes the getter, and one spelling has to
	 * cover both. Every argument is an object, which is the invariant that makes
	 * that test unambiguous.
	 *
	 * The component's own default export is an empty component and is never used,
	 * as `filtering-slots.svelte`'s is.
	 */

	/** What `subFilterRow` needs in order to render one row of a group. */
	export interface SubFilterRowArg {
		config: InternalConfig;
		subFilter: EditablePartialFilter;
		onChange: (updated: EditablePartialFilter) => void;
		isReadOnly: boolean;
	}

	/** What the add/remove buttons need. Both are ghost `Button`s over a callback. */
	export interface ActionButtonArg {
		label: string;
		onclick: () => void;
	}

	/**
	 * What the tree root's label needs. The four label strings arrive resolved
	 * rather than as catalog keys: `useTranslator` reads Svelte context, and a
	 * module-scope snippet has no component instance to read it from.
	 */
	export interface RootLabelArg {
		operatorOptions: { value: string; label: string }[];
		groupOperatorLabel: string;
		groupFallbackLabel: string;
		value: string | undefined;
		onChange: (operatorKey: string) => void;
		isReadOnly: boolean;
	}

	export { subFilterRow, addFilterButton, removeFilterButton, nestedRootLabel };
</script>

{#snippet subFilterRow(arg: SubFilterRowArg | (() => SubFilterRowArg))}
	{@const a = unwrapSlotArg(arg)}
	<NestedSubFilterRow
		config={a.config}
		subFilter={a.subFilter}
		onChange={a.onChange}
		isReadOnly={a.isReadOnly}
	/>
{/snippet}

{#snippet addFilterButton(arg: ActionButtonArg | (() => ActionButtonArg))}
	{@const a = unwrapSlotArg(arg)}
	<Button label={a.label} onclick={a.onclick} variant="ghost" size="sm" />
{/snippet}

{#snippet removeFilterIcon()}
	<Icon icon="close" size="sm" />
{/snippet}

{#snippet removeFilterButton(arg: ActionButtonArg | (() => ActionButtonArg))}
	{@const a = unwrapSlotArg(arg)}
	<Button
		label={a.label}
		icon={removeFilterIcon}
		variant="ghost"
		size="sm"
		onclick={a.onclick}
		isIconOnly
	/>
{/snippet}

{#snippet nestedRootLabel(arg: RootLabelArg | (() => RootLabelArg))}
	{@const a = unwrapSlotArg(arg)}
	<div {...editPopoverNestedRootLabelAttrs()}>
		{#if a.operatorOptions.length > 1}
			<div {...editPopoverOperatorSelectorAttrs()}>
				<Selector
					label={a.groupOperatorLabel}
					isLabelHidden
					options={a.operatorOptions}
					value={a.value}
					onChange={a.onChange}
					isDisabled={a.isReadOnly}
					size="md"
				/>
			</div>
		{:else}
			{a.operatorOptions[0]?.label ?? a.groupFallbackLabel}
		{/if}
	</div>
{/snippet}
