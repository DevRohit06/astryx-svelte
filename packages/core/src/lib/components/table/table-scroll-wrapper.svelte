<script lang="ts">
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { tableScrollWrapperAttrs } from './table-scroll-wrapper.stylex.js';
	import type { TableScrollWrapperProps } from './table-types.js';

	/**
	 * The horizontal scroll container `Table` hands to `BaseTable` as its
	 * `scrollWrapper`, ported from the private `TableScrollWrapper` in Astryx's
	 * `Table/Table.tsx`. Module-private upstream, so it is not on the barrel here
	 * either.
	 *
	 * Upstream destructures `ref` out of `htmlProps` to place it on the element;
	 * an attachment needs no such extraction — it rides the same spread.
	 */
	const {
		children,
		htmlProps,
		xstyle: pluginStyles,
		beforeTable,
		afterTable
	}: TableScrollWrapperProps = $props();

	const t = useTranslator();

	const theme = themeProps('table-scroll-wrapper');
	const attrs = $derived(tableScrollWrapperAttrs(pluginStyles));
</script>

<!--
	Keyboard-focusable so keyboard users can scroll a horizontally overflowing
	table. Uses role="group" (not "region") so multiple tables on a page don't
	create duplicate same-named landmarks (axe: landmark-unique). Callers may
	override role/aria-label via htmlProps.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	tabindex="0"
	role="group"
	aria-label={t('@astryx.table.label')}
	{...htmlProps}
	{...theme}
	class={cx(theme.class, attrs.class)}
	style={attrs.style}
>
	{#if beforeTable}{@render beforeTable()}{/if}
	{@render children()}
	{#if afterTable}{@render afterTable()}{/if}
</div>
