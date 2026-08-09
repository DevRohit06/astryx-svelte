<script lang="ts">
	import Tokenizer, { type TokenizerProps } from '$lib/components/tokenizer/tokenizer.svelte';
	import TestIcon from './test-icon.svelte';
	import type { SearchableItem } from '$lib/components/typeahead/types.js';

	/**
	 * The markup upstream writes inline as JSX around `render`, which a Svelte
	 * case cannot author: a `<form>` wrapper, an RTL ancestor and an element
	 * passed as a prop.
	 *
	 * - `plain` — the tokenizer alone.
	 * - `form` — wrapped in a `<form>`, reached via `container.querySelector('form')`.
	 * - `rtl` — under a `direction: rtl` ancestor.
	 * - `snippet-start-icon` — `startIcon` supplied as a **snippet**, the arm of
	 *   `IconName | Snippet` that stands in for upstream's `ReactNode` start icon.
	 */
	type Variant = 'plain' | 'form' | 'rtl' | 'snippet-start-icon';

	interface Props {
		variant?: Variant;
		tokenizer: TokenizerProps<SearchableItem>;
	}

	const { variant = 'plain', tokenizer }: Props = $props();
</script>

{#snippet startIcon()}
	<TestIcon data-testid="start-icon" />
{/snippet}

{#if variant === 'form'}
	<form>
		<Tokenizer {...tokenizer} />
	</form>
{:else if variant === 'rtl'}
	<div style="direction: rtl">
		<Tokenizer {...tokenizer} />
	</div>
{:else if variant === 'snippet-start-icon'}
	<Tokenizer {...tokenizer} {startIcon} />
{:else}
	<Tokenizer {...tokenizer} />
{/if}
