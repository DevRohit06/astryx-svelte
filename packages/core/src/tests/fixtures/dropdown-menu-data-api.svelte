<script lang="ts" module>
	export type DataApiScenario = 'endContent' | 'richLabel';
</script>

<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';

	/**
	 * The data-mode rows whose fields are *snippets* — upstream writes them as
	 * inline JSX in the test file, which a `.ts` suite cannot author. Both
	 * scenarios exist to prove the `items` array forwards every field of
	 * `DropdownMenuItemData` wholesale rather than hand-copying a few.
	 */
	const { scenario }: { scenario: DataApiScenario } = $props();
</script>

{#snippet shortcut()}<span data-testid="shortcut">⌘K</span>{/snippet}
{#snippet richLabel()}<em data-testid="rich">Rename</em>{/snippet}

{#if scenario === 'endContent'}
	<DropdownMenu
		button={{ label: 'Actions' }}
		items={[{ label: 'Search', description: 'Find anything', endContent: shortcut }]}
	/>
{:else}
	<DropdownMenu button={{ label: 'Actions' }} items={[{ label: richLabel }]} />
{/if}
