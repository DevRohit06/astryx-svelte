<script lang="ts" module>
	import type { TableRowStatus } from './use-table-row-status.js';

	export interface RowStatusCellContentProps {
		/** The row's status, already resolved by the config's `getStatus`. */
		status: TableRowStatus;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import Tooltip from '../../../tooltip/tooltip.svelte';
	import type { IconColor } from '../../../icon/icon.stylex.js';
	import {
		rowStatusDotAttrs,
		rowStatusWrapAttrs,
		type TableRowStatusColor
	} from './row-status.stylex.js';

	/**
	 * The status column's cell body, ported from the `renderCell` closure in
	 * Astryx's `Table/plugins/rowStatus/useTableRowStatus.tsx`.
	 *
	 * It is a component rather than markup inside the hook for the standing
	 * reason: a `.ts` plugin module cannot author a snippet, and this markup needs
	 * both `Icon` and `Tooltip`. The `null` branch stays with the *slot* — a
	 * component that renders nothing still costs an anchor comment per row, and
	 * upstream's `return null` produces no node at all.
	 */
	const { status }: RowStatusCellContentProps = $props();

	/** Icon colors that map cleanly from a semantic status color. */
	const ICON_COLOR_BY_STATUS: Record<TableRowStatusColor, IconColor> = {
		accent: 'accent',
		success: 'success',
		error: 'error',
		warning: 'warning',
		red: 'red',
		orange: 'warning',
		green: 'green',
		yellow: 'warning',
		blue: 'blue',
		gray: 'gray'
	};

	const wrap = rowStatusWrapAttrs();
	const iconColor = $derived(
		ICON_COLOR_BY_STATUS[status.color as TableRowStatusColor] ?? 'primary'
	);
	const dot = $derived(rowStatusDotAttrs(status.color));
</script>

<Tooltip content={status.label}>
	<span class={wrap.class} style={wrap.style} role="img" aria-label={status.label}>
		{#if status.icon}
			<Icon icon={status.icon} size="xsm" color={iconColor} />
		{:else}
			<span class={dot.class} style={dot.style}></span>
		{/if}
	</span>
</Tooltip>
