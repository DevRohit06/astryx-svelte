<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface GroupHeaderCellProps {
		groupKey: string;
		count: number;
		collapsed: boolean;
		/** Toggles this group. */
		toggle: () => void;
		/**
		 * Custom renderer for the header content, right of the chevron.
		 * Upstream's `(groupKey, count, collapsed) => ReactNode` — a render prop
		 * taking arguments, which is a parameterised snippet here.
		 */
		renderGroupHeader?: Snippet<[string, number, boolean]>;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import {
		groupChevronAttrs,
		groupChevronIconCollapsedStyle,
		groupChevronIconExpandedStyle,
		groupChevronIconStyle,
		groupCountAttrs,
		groupHeaderCellAttrs,
		groupHeaderInnerAttrs,
		groupLabelAttrs
	} from './grouped-rows.stylex.js';

	/**
	 * The full-width `<td>` a group-header row renders instead of its cells,
	 * ported from the JSX Astryx assigns to `children` in `transformBodyRow`.
	 */
	let { groupKey, count, collapsed, toggle, renderGroupHeader }: GroupHeaderCellProps = $props();

	const t = useTranslator();

	const cellAttrs = groupHeaderCellAttrs();
	const innerAttrs = $derived(groupHeaderInnerAttrs(renderGroupHeader != null));
	const chevronAttrs = groupChevronAttrs();
	const labelAttrs = groupLabelAttrs();
	const countAttrs = groupCountAttrs();
	const chevronXstyle = $derived([
		groupChevronIconStyle,
		collapsed ? groupChevronIconCollapsedStyle : groupChevronIconExpandedStyle
	]);
</script>

<!--
	colSpan larger than the column count is clamped by the browser to the actual
	number of columns, so the header always spans the full width without the
	plugin knowing the column count.
-->
<td colspan={999} class={cellAttrs.class} style={cellAttrs.style}>
	<span class={innerAttrs.class} style={innerAttrs.style}>
		<!--
			Standalone chevron button, flush with the table's start edge (no heavy
			button chrome) — the keyboard control.
		-->
		<button
			type="button"
			class={chevronAttrs.class}
			style={chevronAttrs.style}
			onclick={(e) => {
				e.stopPropagation();
				toggle();
			}}
			aria-label={collapsed
				? t('@astryx.tableGroupedRows.expandGroup', { groupKey })
				: t('@astryx.tableGroupedRows.collapseGroup', { groupKey })}
			aria-expanded={!collapsed}
		>
			<!--
				The rotation rides on the glyph rather than a wrapper span so the
				`astryx-icon` target reaches both the mark and its open/closed
				transform (#4838).
			-->
			<Icon icon="chevronRight" size="xsm" xstyle={chevronXstyle} />
		</button>
		{#if renderGroupHeader}
			{@render renderGroupHeader(groupKey, count, collapsed)}
		{:else}
			<span class={labelAttrs.class} style={labelAttrs.style}
				>{groupKey} <span class={countAttrs.class} style={countAttrs.style}>({count})</span></span
			>
		{/if}
	</span>
</td>
