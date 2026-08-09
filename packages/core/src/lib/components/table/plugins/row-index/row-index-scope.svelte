<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { RowIndexContextValue } from './row-index-context.svelte.js';

	export interface RowIndexScopeProps {
		/** Getter for the live lookup + offset, supplied by the hook. */
		value: () => RowIndexContextValue;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { RowIndexContext } from './row-index-context.svelte.js';

	/**
	 * Internal — the provider `useTableRowIndex.transformTableContext()` returns.
	 * Renders no DOM of its own.
	 */
	let { value, children }: RowIndexScopeProps = $props();

	// Wrapped, not passed straight through — see `selection-scope.svelte`.
	RowIndexContext.set(() => value());
</script>

{@render children()}
