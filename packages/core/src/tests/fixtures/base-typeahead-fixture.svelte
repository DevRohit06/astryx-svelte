<script lang="ts">
	import BaseTypeahead, {
		type BaseTypeaheadProps
	} from '$lib/components/typeahead/base-typeahead.svelte';
	import type { SearchableItem } from '$lib/components/typeahead/types.js';

	/**
	 * The two `BaseTypeahead focus-out` arrangements upstream writes as JSX around
	 * `render`, which a Svelte case cannot author.
	 *
	 * - `outside` — the combobox followed by a sibling `<button>Outside</button>`,
	 *   somewhere for focus to go that is neither the field nor the dropdown.
	 * - `anchor` — the combobox inside a wrapper div handed to `anchorEl`, with a
	 *   second `<button>Sibling</button>` inside the same wrapper. Upstream builds
	 *   this by hand at runtime (creating the anchor, appending the input's parent
	 *   into it, then appending the button); authoring it as real markup is the
	 *   same arrangement without the DOM surgery.
	 */
	type Variant = 'outside' | 'anchor';

	interface Props {
		variant?: Variant;
		typeahead: Omit<BaseTypeaheadProps<SearchableItem>, 'anchorEl'>;
	}

	const { variant = 'outside', typeahead }: Props = $props();

	let anchor = $state<HTMLDivElement | null>(null);
</script>

{#if variant === 'anchor'}
	<div bind:this={anchor} data-testid="anchor">
		<BaseTypeahead {...typeahead} anchorEl={anchor} />
		<button type="button">Sibling</button>
	</div>
{:else}
	<BaseTypeahead {...typeahead} />
	<button type="button">Outside</button>
{/if}
