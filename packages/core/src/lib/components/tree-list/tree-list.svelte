<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { TreeListDensity, TreeListItemData, TreeListVariant } from './tree-list-types.js';

	export interface TreeListProps extends BaseProps<HTMLDivElement> {
		/**
		 * Tree items as a recursive data structure.
		 * Each item can have nested `children` arrays.
		 */
		items: TreeListItemData[];

		/**
		 * Spacing density for tree list items.
		 * - `'compact'`: tighter spacing for dense UIs
		 * - `'balanced'`: standard spacing
		 * - `'spacious'`: extra spacing for readability
		 * @default 'balanced'
		 */
		density?: TreeListDensity;

		/**
		 * Visual treatment of the hierarchy guide lines, orthogonal to `density`.
		 * - `lineGuides`: connector lines between parent and child rows
		 * - `noGuides`: no connector lines; indentation alone conveys nesting
		 * @default 'lineGuides'
		 */
		variant?: TreeListVariant;

		/**
		 * Header content rendered above the tree list.
		 * Semantically associated via `aria-labelledby`.
		 */
		header?: string | Snippet;

		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}

	/** Recursively collect IDs of items marked as `isExpanded`. */
	function collectExpandedKeys(items: TreeListItemData[]): string[] {
		const keys: string[] = [];
		for (const item of items) {
			if (item.isExpanded && item.children != null && item.children.length > 0) {
				keys.push(item.id);
			}
			if (item.children != null) {
				keys.push(...collectExpandedKeys(item.children));
			}
		}
		return keys;
	}

	/**
	 * Compute the initial roving-tabindex seed: the first selected enabled item in
	 * document order, else the first enabled item, else the first item. The hook
	 * (`useTreeFocus` with `hasRovingTabIndex`) takes ownership after mount — it
	 * preserves this seeded `tabindex="0"` on its repair pass and moves the stop
	 * with keyboard navigation.
	 */
	function findInitialTabbableId(items: TreeListItemData[]): string | undefined {
		let firstEnabled: string | undefined;
		const walk = (list: TreeListItemData[]): string | undefined => {
			for (const item of list) {
				if (item.isSelected && item.isDisabled !== true) {
					return item.id;
				}
				if (firstEnabled == null && item.isDisabled !== true) {
					firstEnabled = item.id;
				}
				if (item.children != null && item.children.length > 0) {
					const selected = walk(item.children);
					if (selected != null) {
						return selected;
					}
				}
			}
			return undefined;
		};
		return walk(items) ?? firstEnabled ?? items[0]?.id;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTreeFocus } from '../../hooks/use-tree-focus.svelte.js';
	import TreeListItem from './tree-list-item.svelte';
	import { treeListHeaderAttrs, treeListListAttrs, treeListRootAttrs } from './tree-list.stylex.js';

	/**
	 * A data-driven tree list component for rendering hierarchical data.
	 *
	 * Accepts an `items` array of recursive config objects. Expansion state is
	 * managed internally — seed initial state by setting `isExpanded: true` on
	 * individual items in the data. Positional data (nestedLevel, isLast,
	 * ancestorsIsLast) is computed during rendering — no context, no snippet
	 * threading, no force-update mechanism.
	 *
	 * @example
	 * ```svelte
	 * <TreeList
	 *   items={[
	 *     { id: 'src', label: 'src', isExpanded: true, children: [
	 *       { id: 'app', label: 'App.svelte' },
	 *       { id: 'index', label: 'index.ts' }
	 *     ] },
	 *     { id: 'pkg', label: 'package.json' }
	 *   ]}
	 * />
	 * ```
	 */
	let {
		items,
		density = 'balanced',
		variant = 'lineGuides',
		header,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TreeListProps = $props();

	const headerId = $props.id();

	// Expanded keys from data: recomputed whenever items change.
	const expandedKeysFromProps = $derived(new Set(collectExpandedKeys(items)));

	// User overrides: only stores IDs the user has explicitly toggled. `$state.raw`
	// because every update is a whole-Map reassignment, as upstream's
	// `setExpandedKeysOverride(prev => new Map(prev))` is.
	let expandedKeysOverride = $state.raw(new Map<string, boolean>());

	function isItemExpanded(id: string): boolean {
		return expandedKeysOverride.has(id)
			? (expandedKeysOverride.get(id) ?? false)
			: expandedKeysFromProps.has(id);
	}

	function handleToggle(id: string): void {
		// A plain `Map` reassigned wholesale, not a `SvelteMap`: this is upstream's
		// `setExpandedKeysOverride(prev => new Map(prev).set(…))` exactly, and the
		// `$state.raw` box is what publishes the change. A `SvelteMap` would make
		// each in-place mutation reactive — a second, redundant mechanism.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Map(expandedKeysOverride);
		next.set(id, !isItemExpanded(id));
		expandedKeysOverride = next;
	}

	// The hook (`hasRovingTabIndex`) owns the tree's single tab stop: it repairs
	// the stop on mount and moves it with keyboard navigation. We only seed the
	// initially-tabbable treeitem in the render (selected item or first enabled);
	// the hook's repair pass preserves that seeded `tabindex="0"`.
	const initialTabbableId = $derived(findInitialTabbableId(items));

	// Whether any *top-level* item can expand. Upstream computes it exactly this
	// way — `items.some(...)` on the prop, outside `renderItems`, which shadows the
	// name during recursion — so a tree whose only expandable item is nested deep
	// does not reserve the column. Leaves consult it to decide whether to hold a
	// chevron-width gutter open; a wholly flat tree holds none.
	const hasExpandableItems = $derived(
		items.some((item) => item.children != null && item.children.length > 0)
	);

	/**
	 * Enter/Space activation: prefer the treeitem's own inner action (link or
	 * button); return true when handled so the hook does not also toggle. Scoped
	 * to this treeitem's own row — never a descendant treeitem's action inside an
	 * expanded group.
	 */
	function activateItem(current: HTMLElement): boolean {
		// The chevron toggle is marked with `data-tree-toggle` (set by
		// `TreeListItem`) so this filter stays stable across locales — matching by
		// aria-label would break under any locale where "Toggle children" is
		// translated.
		const candidates = current.querySelectorAll<HTMLElement>(
			'a[href], button:not([data-tree-toggle])'
		);
		for (const candidate of candidates) {
			if (candidate.closest('[role="treeitem"]') === current) {
				candidate.click();
				return true;
			}
		}
		return false;
	}

	const tree = useTreeFocus(() => ({
		onToggleExpand: handleToggle,
		onActivate: activateItem,
		hasRovingTabIndex: true
	}));

	// `variant` belongs here as well as `density`: `TreeListVariantMap` is
	// declaration-mergeable, so an augmented variant type-checks and renders —
	// and without the axis on the element there is no selector for a theme to
	// style it with. Upstream shipped that gap too and closed it at 0.4.5.
	const theme = $derived(themeProps('tree-list', { density, variant }));
	const rootAttrs = $derived(treeListRootAttrs(xstyle));
	const listAttrs = treeListListAttrs();
	const headerAttrs = treeListHeaderAttrs();
</script>

{#snippet renderItems(
	list: TreeListItemData[],
	nestedLevel: number,
	ancestorsIsLast: ReadonlyArray<boolean>
)}
	{#each list as item, index (item.id)}
		{@const isLast = index === list.length - 1}
		{@const hasChildren = item.children != null && item.children.length > 0}
		{@const isExpanded = isItemExpanded(item.id)}
		{@const ancestorsForChildren = hasChildren ? [...ancestorsIsLast, isLast] : ancestorsIsLast}

		{#snippet childSubtree()}
			{@render renderItems(item.children ?? [], nestedLevel + 1, ancestorsForChildren)}
		{/snippet}

		<TreeListItem
			id={item.id}
			label={item.label}
			description={item.description}
			startContent={item.startContent}
			endContent={item.endContent}
			{hasChildren}
			{hasExpandableItems}
			onClick={item.onClick}
			href={item.href}
			target={item.target}
			isDisabled={item.isDisabled}
			isSelected={item.isSelected}
			{nestedLevel}
			{isLast}
			{ancestorsIsLast}
			{isExpanded}
			onToggle={handleToggle}
			{density}
			{variant}
			renderedChildren={isExpanded && hasChildren ? childSubtree : undefined}
			posInSet={index + 1}
			setSize={list.length}
			isTabbable={item.id === initialTabbableId}
		/>
	{/each}
{/snippet}

<div
	{...rest}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
>
	{#if header != null}
		<div id={headerId} class={headerAttrs.class} style={headerAttrs.style}>
			{#if typeof header === 'function'}{@render header()}{:else}{header}{/if}
		</div>
	{/if}
	<ul
		{@attach tree.attachTree}
		role="tree"
		aria-labelledby={header != null ? headerId : undefined}
		onkeydown={tree.handleKeyDown}
		onfocusin={tree.handleFocus}
		class={listAttrs.class}
		style={listAttrs.style}
	>
		{@render renderItems(items, 0, [])}
	</ul>
</div>
