<script lang="ts" module>
	import type { UseTriggerMenuReturn } from './use-trigger-menu.svelte.js';

	/**
	 * As with `LayerProps`, `PopoverLayerProps` and `LightboxLayerProps`,
	 * upstream has no counterpart name: `useTriggerMenu`'s `renderMenu` is a
	 * function on the hook's return, not a component, so there is nothing there
	 * for a props type to describe. Unlike the imperative-dialog pair this one is
	 * **not published** — its hook is module-private upstream, so exporting the
	 * companion would invent API where the pair invents none.
	 */
	export interface TriggerMenuLayerProps {
		/** The value returned by `useTriggerMenu`. */
		menu: UseTriggerMenuReturn;
	}
</script>

<script lang="ts">
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { groupItems } from '../../utils/group-items.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		triggerMenuDropdownAttrs,
		triggerMenuEmptyStateAttrs,
		triggerMenuGroupHeadingAttrs,
		triggerMenuItemAttrs,
		triggerMenuItemLabelAttrs,
		triggerMenuLoadingStateAttrs,
		triggerMenuPopoverStyle
	} from './use-trigger-menu.stylex.js';

	/**
	 * The rendering half of `useTriggerMenu`, replacing upstream's `renderMenu()`.
	 *
	 * The element tree is upstream's verbatim: a `role="listbox"` dropdown inside
	 * the popover surface, holding either a `role="status"` loading line, an
	 * empty-state line, or the grouped options.
	 *
	 * **Upstream's running `flatIndex` becomes a precomputed offset.** It walks
	 * the groups mutating a counter as it renders, which a Svelte `{#each}`
	 * cannot do (the block body is not a sequential pass); the derived below
	 * assigns each group the count of the items before it, which produces the
	 * same indices by construction. That matters because those indices are the
	 * `aria-activedescendant` targets and the `highlightedIndex` the keyboard
	 * handler moves.
	 */
	const { menu }: TriggerMenuLayerProps = $props();

	const t = useTranslator();

	const trigger = $derived(menu.state.activeTrigger);
	const emptyText = $derived(trigger?.emptySearchResultsText ?? 'No results');
	const loadingText = $derived(trigger?.loadingText ?? 'Searching…');

	const groups = $derived.by(() => {
		let flatIndex = 0;
		return groupItems(menu.state.items).map((group) => {
			const offset = flatIndex;
			flatIndex += group.items.length;
			return { heading: group.heading, items: group.items, offset };
		});
	});

	const dropdown = $derived(triggerMenuDropdownAttrs());
	const theme = themeProps('trigger-menu');
	const loading = $derived(triggerMenuLoadingStateAttrs());
	const empty = $derived(triggerMenuEmptyStateAttrs());
	const groupHeading = $derived(triggerMenuGroupHeadingAttrs());
	const itemLabel = $derived(triggerMenuItemLabelAttrs());
</script>

{#snippet options(items: typeof menu.state.items, offset: number)}
	{#each items as item, i (item.id)}
		{@const idx = offset + i}
		{@const attrs = triggerMenuItemAttrs(idx === menu.state.highlightedIndex)}
		<div
			id={menu.getItemId(idx)}
			role="option"
			aria-selected={idx === menu.state.highlightedIndex}
			tabindex={-1}
			onmousedown={(e) => {
				e.preventDefault(); // Keep focus in the editable
				menu.selectItem(item);
			}}
			onmouseenter={() => menu.setHighlightedIndex(idx)}
			class={attrs.class}
			style={attrs.style}
		>
			{#if trigger?.renderItem}
				{@render trigger.renderItem(item)}
			{:else}
				<span class={itemLabel.class} style={itemLabel.style}>{item.label}</span>
			{/if}
		</div>
	{/each}
{/snippet}

<PopoverLayer
	popover={menu.popover}
	placement="above"
	alignment="start"
	xstyle={triggerMenuPopoverStyle}
>
	<div
		id={menu.listboxId}
		role="listbox"
		aria-label={trigger?.menuLabel ?? t('@astryx.chatTriggerMenu.suggestions')}
		class={cx(theme.class, dropdown.class)}
		style={dropdown.style}
	>
		{#if menu.state.isLoading}
			<div role="status" class={loading.class} style={loading.style}>{loadingText}</div>
		{:else if menu.state.items.length === 0 && menu.state.isActive}
			<div class={empty.class} style={empty.style}>{emptyText}</div>
		{:else}
			{#each groups as group (group.heading ?? '__ungrouped__')}
				{#if group.heading}
					<div role="group" aria-label={group.heading}>
						<div aria-hidden="true" class={groupHeading.class} style={groupHeading.style}>
							{group.heading}
						</div>
						{@render options(group.items, group.offset)}
					</div>
				{:else}
					{@render options(group.items, group.offset)}
				{/if}
			{/each}
		{/if}
	</div>
</PopoverLayer>
