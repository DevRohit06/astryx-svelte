<script lang="ts">
	import Selector, { type SelectorProps } from '$lib/components/selector/selector.svelte';
	import SelectorOption from '$lib/components/selector/selector-option.svelte';
	import type { SelectorOptionData } from '$lib/components/selector/types.js';

	/**
	 * The markup upstream writes inline as JSX around (or inside) `render`, which
	 * a Svelte case cannot author: a `<form>` wrapper, an RTL ancestor, a sibling
	 * tab target, and the `renderOption` render prop.
	 *
	 * - `plain` — the selector alone.
	 * - `form` — wrapped in a `<form>`, reached via `container.querySelector('form')`,
	 *   the shape `slider-form.svelte` and `switch-form.svelte` already use.
	 * - `rtl` — under a `direction: rtl` ancestor.
	 * - `next` — followed by a `<button>Next</button>`, so a Tab out has somewhere
	 *   to land.
	 * - `render-option` — supplies the `renderOption` snippet upstream passes as a
	 *   function prop: a `SelectorOption` carrying an `endContent` badge.
	 *
	 * The selector's own props arrive under one `selector` key rather than being
	 * merged into this component's: `SelectorProps` is a discriminated union, and
	 * flattening it into a rest spread makes TypeScript widen the two arms into a
	 * union it reports as "too complex to represent".
	 */
	type Variant = 'plain' | 'form' | 'rtl' | 'next' | 'render-option';

	interface Props {
		variant?: Variant;
		selector: SelectorProps;
	}

	const { variant = 'plain', selector }: Props = $props();
</script>

{#snippet badge()}
	<span data-testid="option-badge">Owner</span>
{/snippet}

{#snippet renderOption(option: SelectorOptionData)}
	<SelectorOption label={option.label ?? option.value} endContent={badge} />
{/snippet}

{#if variant === 'form'}
	<form>
		<Selector {...selector} />
	</form>
{:else if variant === 'rtl'}
	<div style="direction: rtl">
		<Selector {...selector} />
	</div>
{:else if variant === 'next'}
	<Selector {...selector} />
	<button type="button">Next</button>
{:else if variant === 'render-option'}
	<Selector {...selector} {renderOption} />
{:else}
	<Selector {...selector} />
{/if}
