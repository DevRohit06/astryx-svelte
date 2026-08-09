<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { UseTableFilteringConfig } from './use-table-filtering.js';

	export interface FilterDraftScopeProps {
		/** Getter for the buffered config the popover's control writes to. */
		config: () => UseTableFilteringConfig;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { FilterConfigContext } from './filter-context.svelte.js';

	/**
	 * Internal — overrides {@link FilterConfigContext} for the popover's content.
	 *
	 * This is upstream's `<FilterStoreContext value={draftStore}>` inside
	 * `PopoverFilterTrigger`, and it is the reason the config lives in a context
	 * of its own rather than as one member of a wider one: the popover buffers
	 * edits locally and only commits them on "Apply", which it achieves by
	 * shadowing the config that `FilterControl` reads. The variant context is
	 * untouched, exactly as upstream leaves it.
	 *
	 * Renders no DOM of its own.
	 */
	let { config, children }: FilterDraftScopeProps = $props();

	// Wrapped, not passed straight through — see `filtering-scope.svelte`. Here it
	// matters twice over: the draft config is rebuilt from `$state` on every read.
	FilterConfigContext.set(() => config());
</script>

{@render children()}
