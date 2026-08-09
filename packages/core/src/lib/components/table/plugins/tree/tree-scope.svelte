<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { UseTableTreeDataConfig } from './use-table-tree-data.js';

	export interface TreeScopeProps {
		/** Getter for the live tree config, supplied by the hook. */
		config: () => UseTableTreeDataConfig<Record<string, unknown>>;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { TreeConfigContext } from './tree-context.svelte.js';

	/**
	 * Internal — the provider `useTableTreeData.transformTableContext()` returns.
	 *
	 * Upstream's transform closes over its store and returns
	 * `<TreeStoreContext value={store}>{children}</TreeStoreContext>`. Svelte sets
	 * context at component init, so the port needs a component boundary; the hook
	 * binds `config` onto this one with `withProps`, because `TableContextProvider`
	 * declares only `children` and a `.ts` hook has no other way to hand it state.
	 *
	 * Renders no DOM of its own.
	 */
	let { config, children }: TreeScopeProps = $props();

	// Wrapped rather than passed straight through: `config` is a prop, and handing
	// the context the prop's *initial* value would freeze it. The arrow re-reads
	// it on every call, so a consumer swapping configs stays live.
	TreeConfigContext.set(() => config());
</script>

{@render children()}
