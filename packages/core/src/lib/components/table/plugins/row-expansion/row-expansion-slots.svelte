<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import Icon from '../../../icon/icon.svelte';
	import ExpandAllToggle from './expand-all-toggle.svelte';
	import ExpansionChevron from './expansion-chevron.svelte';
	import IndentedCell from './indented-cell.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';

	/**
	 * The row-expansion plugin's markup slots, as **module-exported snippets**.
	 *
	 * Every one of them is bound per cell rather than read from a context, which
	 * is the `sortable` shape rather than the `selection` shape. The reason is
	 * `expansionFirstColumnCell`: it closes over the wrapped column's key *and*
	 * over the renderer that column already had, neither of which a context can
	 * carry, so a binder is required regardless. Once it is there, routing the
	 * other two through it as well keeps the plugin free of a
	 * `transformTableContext` provider it would otherwise need for one header
	 * button.
	 *
	 * The bindings are **keyed** by column, through `createSlotBinder` /
	 * `createCellSlotBinder` in `internal/bind-snippet.ts`. `{@render}` branches
	 * on a snippet's function identity, so a fresh binding per transform would
	 * replace the chevron rather than update it — destroying the button a
	 * keyboard user just pressed and dropping focus to `<body>`.
	 *
	 * The two icon snippets take no argument at all, so they are plain module
	 * snippets — the same shape as `sortable-slots.svelte`'s action icons.
	 *
	 * The component's own default export is an empty component and is never used.
	 */
	export {
		expansionCell,
		expansionFirstColumnCell,
		expandAllContent,
		chevronDownIcon,
		chevronRightIcon
	};

	/** What the synthetic `__expansion` column's cell needs for one row. */
	export interface ExpansionCellArg {
		/**
		 * Upstream returns `null` from `renderCell` twice — for child rows, which
		 * show their chevron inline in the first content column instead, and for
		 * rows that are not expandable. A snippet has no "render nothing" return,
		 * so the two guards resolve to this one flag.
		 */
		isVisible: boolean;
		isExpanded: boolean;
		onToggle: () => void;
		ariaLabel: string;
	}

	/** What the wrapped first content column's cell needs for one row. */
	export interface ExpansionFirstColumnCellArg {
		/** The row, folded into the argument so the slot stays a one-parameter snippet. */
		item: Record<string, unknown>;
		/** Nesting level; `0` renders the original content untouched. */
		depth: number;
		/** `(depth - 1) * INDENT_PER_DEPTH`, in pixels. Read only when `depth > 0`. */
		indent: number;
		isExpandable: boolean;
		isExpanded: boolean;
		onToggle: () => void;
		ariaLabel: string;
		/** The column's own renderer, if it had one. */
		renderCell?: Snippet<[Record<string, unknown>]>;
		/** `String(item[column.key] ?? '')` — upstream's fallback when it had none. */
		text: string;
	}

	/** What the expansion column's header cell needs. */
	export interface ExpandAllArg {
		allExpanded: boolean;
		onToggleExpandAll: (expand: boolean) => void;
		ariaLabel: string;
	}
</script>

{#snippet expansionCell(arg: ExpansionCellArg | (() => ExpansionCellArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.isVisible}
		<ExpansionChevron isExpanded={a.isExpanded} onToggle={a.onToggle} ariaLabel={a.ariaLabel} />
	{/if}
{/snippet}

{#snippet expansionFirstColumnCell(
	arg: ExpansionFirstColumnCellArg | (() => ExpansionFirstColumnCellArg)
)}
	{@const a = unwrapSlotArg(arg)}
	<!--
		Upstream's `originalContent` local, which it computes once and places in
		both branches. A snippet renders where it is used, so the shared content
		becomes a locally-declared snippet — local, so the module-export rule
		(reference nothing outside yourself) still holds for the exported one.
	-->
	{#snippet originalContent()}
		{#if a.renderCell}{@render a.renderCell(a.item)}{:else}{a.text}{/if}
	{/snippet}
	{#if a.depth === 0}
		{@render originalContent()}
	{:else}
		<IndentedCell
			indent={a.indent}
			isExpandable={a.isExpandable}
			isExpanded={a.isExpanded}
			onToggle={a.onToggle}
			ariaLabel={a.ariaLabel}
			content={originalContent}
		/>
	{/if}
{/snippet}

{#snippet expandAllContent(arg: ExpandAllArg | (() => ExpandAllArg))}
	{@const a = unwrapSlotArg(arg)}
	<ExpandAllToggle
		allExpanded={a.allExpanded}
		onToggleExpandAll={a.onToggleExpandAll}
		ariaLabel={a.ariaLabel}
	/>
{/snippet}

{#snippet chevronDownIcon()}
	<Icon icon="chevronDown" size="xsm" aria-hidden="true" />
{/snippet}

{#snippet chevronRightIcon()}
	<Icon icon="chevronRight" size="xsm" aria-hidden="true" />
{/snippet}
