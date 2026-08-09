<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import ColumnResizeHandle from './column-resize-handle.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';
	import type { ResizeSession } from './column-resize-utils.js';
	import type { UseTableColumnResizeConfig } from './use-table-column-resize.js';

	/** What `resizeOverlay` needs to render one header cell's resize handle. */
	export interface ResizeOverlayArg {
		/**
		 * Whatever a prior plugin already put in the `overlay` slot. Upstream
		 * renders `<>{props.overlay}{handle}</>`; this is the first half of it.
		 */
		prior?: Snippet;
		columnKey: string;
		columnHeader: string | Snippet;
		currentWidth: number | undefined;
		minWidth: number;
		maxWidth: number;
		neighborKey: string | null;
		config: () => UseTableColumnResizeConfig;
		session: ResizeSession;
	}

	/**
	 * The column-resize plugin's markup slot.
	 *
	 * `HeaderCellRenderProps.overlay` is a zero-argument `Snippet`, and a `.ts`
	 * hook cannot author one — so the markup lives here as a *parameterised*
	 * module snippet and the hook binds its argument per header cell through
	 * `createSlotBinder`, keyed by `column.key`. It closes over the column, the
	 * widths resolved for it and the overlay content the slot already held, none
	 * of which a context can carry. The binding is *keyed* so the bound snippet
	 * keeps one function identity per column: `{@render}` branches on that
	 * identity, so an unkeyed binding would replace the focused splitter mid-drag
	 * rather than update it. See `internal/bind-snippet.ts` for the mechanism and
	 * for why the parameter is read through `unwrapSlotArg`.
	 */
	export { resizeOverlay };
</script>

{#snippet resizeOverlay(arg: ResizeOverlayArg | (() => ResizeOverlayArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.prior}{@render a.prior()}{/if}
	<ColumnResizeHandle
		columnKey={a.columnKey}
		columnHeader={a.columnHeader}
		currentWidth={a.currentWidth}
		minWidth={a.minWidth}
		maxWidth={a.maxWidth}
		neighborKey={a.neighborKey}
		config={a.config}
		session={a.session}
	/>
{/snippet}
