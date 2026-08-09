<script lang="ts">
	import MultiSelector, {
		type MultiSelectorProps
	} from '$lib/components/multi-selector/multi-selector.svelte';
	import type { MultiSelectorOptionData } from '$lib/components/multi-selector/types.js';

	/**
	 * The markup upstream writes inline as JSX around (or inside) `render`, which
	 * a Svelte case cannot author: a `<form>` wrapper, a sibling tab target, and
	 * the `renderOption` render prop.
	 *
	 * - `plain` — the multi-selector alone.
	 * - `form` — wrapped in a `<form>`, reached via `container.querySelector('form')`,
	 *   the shape `selector-fixture.svelte` already uses.
	 * - `next` — followed by a `<button>Next</button>`, so a Tab out has somewhere
	 *   to land.
	 * - `render-option` — supplies the `renderOption` snippet upstream passes as a
	 *   function prop.
	 */
	type Variant = 'plain' | 'form' | 'next' | 'render-option';

	interface Props {
		variant?: Variant;
		selector: MultiSelectorProps;
	}

	const { variant = 'plain', selector }: Props = $props();
</script>

{#snippet renderOption(option: MultiSelectorOptionData)}
	<span data-testid="custom-option">{option.label}</span>
{/snippet}

{#if variant === 'form'}
	<form>
		<MultiSelector {...selector} />
	</form>
{:else if variant === 'next'}
	<MultiSelector {...selector} />
	<button type="button">Next</button>
{:else if variant === 'render-option'}
	<MultiSelector {...selector} {renderOption} />
{:else}
	<MultiSelector {...selector} />
{/if}
