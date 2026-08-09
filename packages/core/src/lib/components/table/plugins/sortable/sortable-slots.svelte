<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import Icon from '../../../icon/icon.svelte';
	import SortHeaderButton from './sort-header-button.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';
	import type { TableColumn } from '../../table-types.js';
	import type { UseTableSortableConfig } from './use-table-sortable.js';

	/** What `sortContent` needs in order to render one header's sort button. */
	export interface SortContentArg {
		column: TableColumn<Record<string, unknown>>;
		inner?: string | Snippet;
		config: () => UseTableSortableConfig;
	}

	/**
	 * The sortable plugin's markup slots.
	 *
	 * `sortContent` is bound per header cell through `createSlotBinder`, keyed by
	 * `column.key` — it closes over the column and the content the slot already
	 * held, neither of which a context can carry. The keying is what keeps the
	 * sort button alive across a sort change: `{@render}` branches on the bound
	 * snippet's function identity, so an unkeyed binding would destroy the very
	 * button a keyboard user just pressed. The three action icons take no
	 * argument at all, so they are plain module snippets.
	 */
	export { sortContent, sortAscIcon, sortDescIcon, sortClearIcon };
</script>

{#snippet sortContent(arg: SortContentArg | (() => SortContentArg))}
	{@const a = unwrapSlotArg(arg)}
	<SortHeaderButton column={a.column} inner={a.inner} config={a.config} />
{/snippet}

{#snippet sortAscIcon()}
	<Icon icon="arrowUp" size="xsm" aria-hidden="true" />
{/snippet}

{#snippet sortDescIcon()}
	<Icon icon="arrowDown" size="xsm" aria-hidden="true" />
{/snippet}

{#snippet sortClearIcon()}
	<Icon icon="close" size="xsm" aria-hidden="true" />
{/snippet}
