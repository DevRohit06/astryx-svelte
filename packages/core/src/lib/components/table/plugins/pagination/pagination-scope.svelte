<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { UseTablePaginationConfig } from './use-table-pagination.js';

	export interface PaginationScopeProps {
		/** Getter for the live config, supplied by the hook. */
		config: () => UseTablePaginationConfig;
		children: Snippet;
	}
</script>

<script lang="ts">
	import Pagination from '../../../pagination/pagination.svelte';
	import type { PaginationProps } from '../../../pagination/pagination.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { paginationWrapperAttrs } from './pagination.stylex.js';

	/**
	 * Internal — what `useTablePagination.transformTableContext()` returns.
	 *
	 * Upstream's transform is the one in the family that sets **no context at
	 * all**: it returns a fragment with the controls before and/or after
	 * `children`. `TableContextProvider` renders around the table either way, so
	 * this component is that fragment.
	 *
	 * Upstream's `useRef` snapshot of `{paginationProps, position, align}` exists
	 * so the plugin object can stay `useMemo(…, [])` while still reading current
	 * values. The config getter is that, so the ref has no counterpart.
	 */
	let { config, children }: PaginationScopeProps = $props();

	const t = useTranslator();

	const resolved = $derived.by(() => {
		const c = config();
		const {
			page,
			onPageChange,
			totalItems,
			totalPages: totalPagesProp,
			hasMore,
			pageSize: pageSizeConfig = 10,
			onPageSizeChange,
			pageSizeOptions,
			variant = 'pages',
			size = 'md',
			position = 'below',
			align = 'center',
			label: labelFromProps
		} = c;

		// Same guard as Pagination itself: 0/NaN/negative pageSize would produce
		// an Infinity/NaN totalPages here, which bypasses Pagination's own
		// coercion because it is passed down as the explicit totalPages prop.
		const pageSize = Number.isFinite(pageSizeConfig) ? Math.max(1, Math.floor(pageSizeConfig)) : 10;

		const computedTotalPages =
			totalPagesProp ?? (totalItems != null ? Math.ceil(totalItems / pageSize) : undefined);

		const paginationProps: PaginationProps = {
			page,
			onChange: onPageChange,
			totalItems,
			totalPages: computedTotalPages,
			hasMore,
			pageSize,
			onPageSizeChange,
			pageSizeOptions,
			variant,
			size,
			label: labelFromProps ?? t('@astryx.table.pagination.label')
		};

		// Don't render pagination when there's only one page and no more data.
		const resolvedTotalPages =
			paginationProps.totalPages ??
			(paginationProps.totalItems != null && paginationProps.pageSize != null
				? Math.ceil(paginationProps.totalItems / paginationProps.pageSize)
				: undefined);
		const isSinglePage = resolvedTotalPages === 1 && paginationProps.hasMore !== true;

		return {
			paginationProps,
			align,
			hidden: position === 'none' || isSinglePage,
			above: position === 'above' || position === 'both',
			below: position === 'below' || position === 'both'
		};
	});
</script>

{#snippet controls(side: 'above' | 'below')}
	{@const attrs = paginationWrapperAttrs(side, resolved.align)}
	<div class={attrs.class} style={attrs.style}>
		<Pagination {...resolved.paginationProps} />
	</div>
{/snippet}

{#if resolved.hidden}
	{@render children()}
{:else}
	{#if resolved.above}{@render controls('above')}{/if}
	{@render children()}
	{#if resolved.below}{@render controls('below')}{/if}
{/if}
