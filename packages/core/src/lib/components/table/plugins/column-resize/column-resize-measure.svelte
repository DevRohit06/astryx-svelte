<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	export interface ColumnResizeMeasureProps {
		/**
		 * The hook's measure attachment — locates the `<table>` inside and
		 * observes its height. Bound once by `withProps`, so its identity is
		 * stable and the attachment never re-runs.
		 */
		measure: Attachment<HTMLDivElement>;
		children: Snippet;
	}
</script>

<script lang="ts">
	/**
	 * Internal — the provider `useTableColumnResize.transformTableContext()`
	 * returns.
	 *
	 * Unlike the other plugins' scope components this one *does* render DOM,
	 * because upstream's `transformTableContext` does: a
	 * `display: contents` `<div>` carrying the ref that measures the table. The
	 * div is layout-neutral, so it is the wrapper upstream renders, not an
	 * invention of the port. What changed is only how the element is reached —
	 * `ref={measureRef}` becomes `{@attach measure}`.
	 */
	let { measure, children }: ColumnResizeMeasureProps = $props();
</script>

<div {@attach measure} style="display:contents">
	{@render children()}
</div>
