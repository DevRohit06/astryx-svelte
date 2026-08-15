<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { StyleArg } from '../../internal/sx.js';
	import type { TableContextAction, TableContextActions } from './table-types.js';

	/**
	 * Resolve a `contextMenuActions` value (array or getter) to a plain array.
	 * Use this when composing actions from a prior plugin's render props so you
	 * don't have to branch on the array-vs-getter form:
	 *
	 * ```ts
	 * contextMenuActions: () => [
	 *   ...resolveContextActions(props.contextMenuActions),
	 *   ...myActions
	 * ]
	 * ```
	 */
	export function resolveContextActions(
		actions: TableContextActions | undefined
	): TableContextAction[] {
		if (typeof actions === 'function') {
			return actions();
		}
		return actions ?? [];
	}

	export interface TableContextMenuProps {
		/** The wrapped content — a cell's children. */
		children: Snippet;
		/** Aggregated actions. A getter is resolved lazily, on open. */
		actions?: TableContextActions;
		/** Styles for the right-click target wrapper. */
		triggerXstyle?: StyleArg;
	}
</script>

<script lang="ts">
	import ContextMenu, { type ContextMenuOption } from '../context-menu/context-menu.svelte';
	import Icon from '../icon/icon.svelte';

	/**
	 * Ported from Astryx's `Table/tableContextMenu.tsx` — the whole module, since
	 * `wrapInTableContextMenu` and its private `LazyTableContextMenu` are one
	 * component here. Upstream's helper *returns* a node; a Svelte component
	 * cannot, so the branch becomes markup and the cells render
	 * `<TableContextMenu>` unconditionally. The "no actions" case still emits no
	 * wrapper at all, which is what keeps the native browser menu passing
	 * through.
	 *
	 * `resolveContextActions` sits in the module block, as `generatePageRange`
	 * does in `Pagination`: it is public API upstream declares in this same file.
	 */
	const { children, actions, triggerXstyle }: TableContextMenuProps = $props();

	const isLazy = $derived(typeof actions === 'function');
	const hasActions = $derived(isLazy || (Array.isArray(actions) && actions.length > 0));

	// Resolved lazily for the getter form — only when the user opens the menu.
	// Deferring the work means plugins that pass a getter don't build an action
	// array (with its closures) for every cell on every render; it's computed on
	// demand and held until the menu closes.
	let lazyOptions = $state<ContextMenuOption[] | null>(null);

	const options = $derived(
		isLazy ? (lazyOptions ?? []) : toContextMenuOptions(resolveContextActions(actions))
	);

	/**
	 * Convert the flat action list into ContextMenu options, inserting a divider
	 * between groups (first-seen group order). Ungrouped actions form a trailing
	 * group. A `checked` action shows a trailing check icon.
	 */
	function toContextMenuOptions(list: TableContextAction[]): ContextMenuOption[] {
		const order: string[] = [];
		// Plain Map on purpose: it is grouping scratch space inside this pure
		// function, discarded before it returns, and nothing ever reads it in a
		// render or an effect. A `SvelteMap` would add signal bookkeeping to
		// every `get`/`set` for no reader.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const buckets = new Map<string, TableContextAction[]>();
		for (const action of list) {
			const key = action.group ?? '__ungrouped__';
			let bucket = buckets.get(key);
			if (!bucket) {
				bucket = [];
				buckets.set(key, bucket);
				order.push(key);
			}
			bucket.push(action);
		}

		const out: ContextMenuOption[] = [];
		order.forEach((key, groupIndex) => {
			if (groupIndex > 0) {
				out.push({ type: 'divider' });
			}
			for (const action of buckets.get(key) ?? []) {
				out.push({
					label: typeof action.label === 'string' ? action.label : action.id,
					// A checked action (e.g. the active sort direction) shows a
					// checkmark; otherwise the action's own icon. ContextMenu's data
					// form takes a single leading icon, so checked state replaces it.
					icon: action.checked ? checkIcon : action.icon,
					isDisabled: action.disabled,
					onClick: action.onSelect,
					variant: action.variant
				});
			}
		});
		return out;
	}

	function handleOpenChange(open: boolean): void {
		// Resolve actions when opening; clear on close so state derived later
		// (e.g. current sort direction) is always fresh next open.
		lazyOptions = open ? toContextMenuOptions(resolveContextActions(actions)) : null;
	}
</script>

{#snippet checkIcon()}
	<Icon icon="check" size="xsm" aria-hidden="true" />
{/snippet}

{#if hasActions}
	<ContextMenu items={options} {triggerXstyle} onOpenChange={isLazy ? handleOpenChange : undefined}>
		{@render children()}
	</ContextMenu>
{:else}
	{@render children()}
{/if}
