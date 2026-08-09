<script lang="ts">
	import PowerSearchValueEditor from '$lib/components/power-search/power-search-value-editor.svelte';
	import type { FilterValue } from '$lib/components/power-search/types.js';
	import type { InternalConfig } from '$lib/components/power-search/use-internal-config.svelte.js';
	import type { SearchableItem, SearchSource } from '$lib/components/typeahead/types.js';

	/**
	 * Upstream's `passes renderItem from operatorValue to Tokenizer` builds the
	 * render prop inline:
	 * `renderItem={item => <span data-testid="custom-render">{item.label}</span>}`.
	 *
	 * `renderItem` is a `Snippet<[SearchableItem]>` here (the translation
	 * `types.ts` settled, and already the shape `Tokenizer.renderItem` takes), and
	 * a snippet can only be authored in a template — so the operator value is
	 * built in a fixture rather than in the case.
	 */
	interface Props {
		searchSource: SearchSource;
		config: InternalConfig;
		onChange: (value: FilterValue, shouldSave?: boolean) => void;
	}

	const { searchSource, config, onChange }: Props = $props();
</script>

{#snippet customRenderItem(item: SearchableItem)}
	<span data-testid="custom-render">{item.label}</span>
{/snippet}

<PowerSearchValueEditor
	operatorValue={{ type: 'entity_list', searchSource, renderItem: customRenderItem }}
	filterValue={undefined}
	{onChange}
	{config}
/>
