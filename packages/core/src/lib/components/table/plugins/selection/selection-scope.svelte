<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { UseTableSelectionConfig } from './use-table-selection.js';

	export interface SelectionScopeProps {
		/** Getter for the live selection config, supplied by the hook. */
		config: () => UseTableSelectionConfig<Record<string, unknown>>;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { SelectionConfigContext } from './selection-context.svelte.js';

	/**
	 * Internal — the provider `useTableSelection.transformTableContext()` returns.
	 *
	 * Upstream's transform closes over its store and returns
	 * `<SelectionStoreContext value={store}>{children}</SelectionStoreContext>`.
	 * Svelte sets context at component init, so the port needs a component
	 * boundary; the hook binds `config` onto this one with `withProps`, because
	 * `TableContextProvider` declares only `children` and a `.ts` hook has no
	 * other way to hand it state.
	 *
	 * Renders no DOM of its own.
	 */
	let { config, children }: SelectionScopeProps = $props();

	// Wrapped rather than passed straight through: `config` is a prop, and
	// handing the context the prop's *initial* value would freeze it. The arrow
	// re-reads it on every call, so a consumer swapping configs stays live.
	SelectionConfigContext.set(() => config());
</script>

{@render children()}
