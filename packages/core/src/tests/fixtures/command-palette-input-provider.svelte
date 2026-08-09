<script lang="ts" module>
	import type { CommandPaletteContextValue } from '$lib/components/command-palette/command-palette-context.svelte.js';

	export interface CommandPaletteInputProviderProps {
		/** Overrides merged over the stub context value. */
		context?: Partial<CommandPaletteContextValue>;
		/** Wrap in `<Dialog isOpen isInline>` — the auto-focus suppression case. */
		inDialog?: boolean;
	}
</script>

<script lang="ts">
	import { vi } from 'vitest';
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import CommandPaletteInput from '$lib/components/command-palette/command-palette-input.svelte';
	import { setCommandPaletteContext } from '$lib/components/command-palette/command-palette-context.svelte.js';

	/**
	 * The provider fixture for upstream's `CommandPaletteInput dialog context`
	 * describe. Upstream renders `<CommandPaletteContext value={makeContext()}>`
	 * directly; a Svelte context can only be set from a component, so its
	 * `makeContext` helper becomes this fixture's default value.
	 */
	const { context, inDialog = false }: CommandPaletteInputProviderProps = $props();

	const value = $derived<CommandPaletteContextValue>({
		search: '',
		setSearch: vi.fn(),
		value: '',
		setValue: vi.fn(),
		listId: 'list-1',
		highlightedIndex: -1,
		setHighlightedIndex: vi.fn(),
		getItemId: (i: number) => `item-${i}`,
		selectableItems: [],
		searchResults: [],
		selectItem: vi.fn(),
		onKeyDown: vi.fn(),
		onClose: vi.fn(),
		isOpen: true,
		isBusy: false,
		...context
	});

	setCommandPaletteContext(() => value);
</script>

{#if inDialog}
	<Dialog isOpen isInline onOpenChange={() => {}}>
		<CommandPaletteInput />
	</Dialog>
{:else}
	<CommandPaletteInput />
{/if}
