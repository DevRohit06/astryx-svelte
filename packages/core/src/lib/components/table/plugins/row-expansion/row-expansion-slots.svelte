<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import Icon from '../../../icon/icon.svelte';
	import ExpansionChevron from './expansion-chevron.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';
	import { expansionExpandedCellAttrs, expansionExpandedRowAttrs } from './row-expansion.stylex.js';
	import { rtlStyles } from '../../../../utils/rtl.stylex.js';

	/**
	 * The row-expansion plugin's markup slots, as **module-exported snippets**.
	 *
	 * A `.ts` hook cannot author a snippet, so every piece of markup upstream
	 * builds inline in `useTableRowExpansion.tsx` lives here and is bound per
	 * cell / per row through the **keyed** binders in `internal/bind-snippet.ts`.
	 * `{@render}` branches on a snippet's function identity, so a fresh binding
	 * per transform would replace the chevron rather than update it — destroying
	 * the button a keyboard user just pressed and dropping focus to `<body>`.
	 * Upstream never meets this, because React reconciles by type-and-key.
	 *
	 * The two icon snippets take no argument at all, so they are plain module
	 * snippets — the same shape as `sortable-slots.svelte`'s action icons.
	 *
	 * The component's own default export is an empty component and is never used.
	 */
	export { expansionCell, expandedPanel, afterRowFragment, chevronDownIcon, chevronRightIcon };

	/** What the synthetic `__expansion` column's cell needs for one row. */
	export interface ExpansionCellArg {
		/**
		 * Upstream returns `null` from `renderCell` for a row `getIsItemExpandable`
		 * rejects. A snippet has no "render nothing" return, so the guard resolves
		 * to this flag.
		 */
		isVisible: boolean;
		isExpanded: boolean;
		onToggle: () => void;
		ariaLabel: string;
	}

	/** What the full-width detail panel needs for one row. */
	export interface ExpandedPanelArg {
		/** The row, folded in so the consumer's `renderExpanded` can be handed it. */
		item: Record<string, unknown>;
		/** Every rendered column, including the synthetic `__expansion` one. */
		columnCount: number;
		/** The consumer's `renderExpanded`. */
		renderExpanded: Snippet<[Record<string, unknown>]>;
	}

	/**
	 * Upstream's `<>{props.afterRow}{panel}</>` — the composition that lets two
	 * plugins each append a row after the same `<tr>`.
	 */
	export interface AfterRowArg {
		/** Whatever a prior plugin already put in `afterRow`, if anything. */
		previous?: Snippet;
		/** This plugin's panel. */
		panel: Snippet;
	}
</script>

{#snippet expansionCell(arg: ExpansionCellArg | (() => ExpansionCellArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.isVisible}
		<ExpansionChevron isExpanded={a.isExpanded} onToggle={a.onToggle} ariaLabel={a.ariaLabel} />
	{/if}
{/snippet}

{#snippet expandedPanel(arg: ExpandedPanelArg | (() => ExpandedPanelArg))}
	{@const a = unwrapSlotArg(arg)}
	{@const row = expansionExpandedRowAttrs()}
	{@const cell = expansionExpandedCellAttrs()}
	<tr class={row.class} style={row.style}>
		<td colspan={a.columnCount} class={cell.class} style={cell.style}>
			{@render a.renderExpanded(a.item)}
		</td>
	</tr>
{/snippet}

{#snippet afterRowFragment(arg: AfterRowArg | (() => AfterRowArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.previous}{@render a.previous()}{/if}
	{@render a.panel()}
{/snippet}

{#snippet chevronDownIcon()}
	<Icon icon="chevronDown" size="xsm" aria-hidden="true" />
{/snippet}

{#snippet chevronRightIcon()}
	<!--
		`chevronDown` needs no mirroring; `chevronRight` — the collapsed state,
		pointing toward the reveal direction — does.
	-->
	<Icon icon="chevronRight" size="xsm" aria-hidden="true" xstyle={rtlStyles.mirror} />
{/snippet}
