<script lang="ts" module>
	/** One compound-mode entry: a menu item, or a divider. */
	export interface CompoundEntry {
		label?: string;
		onClick?: () => void;
		/** Renders `endContent` as `<span data-testid>⌘X</span>`. */
		endContentTestid?: string;
		divider?: boolean;
	}
</script>

<script lang="ts">
	import ContextMenu from '$lib/components/context-menu/context-menu.svelte';
	import DropdownMenuItem from '$lib/components/dropdown-menu/dropdown-menu-item.svelte';
	import Divider from '$lib/components/divider/divider.svelte';

	/**
	 * `<ContextMenu>` with its trigger and (optionally) its compound menu content.
	 *
	 * Upstream writes the trigger as JSX children and `menuContent` as inline JSX;
	 * both are snippets here, so the shapes its cases use become flags.
	 */
	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		/** Trigger text. */
		triggerText?: string;
		/** Render the trigger as a `<button>` (the focus-restore case). */
		isTriggerButton?: boolean;
		/** Compound mode: these entries become `menuContent`. */
		compound?: CompoundEntry[];
	}

	const {
		props = {},
		triggerText = 'Right-click me',
		isTriggerButton = false,
		compound
	}: Props = $props();
</script>

{#snippet menuContent()}
	{#each compound ?? [] as entry, i (i)}
		{#if entry.divider}
			<Divider />
		{:else}
			{#snippet endContent()}
				<span data-testid={entry.endContentTestid}>⌘X</span>
			{/snippet}
			<DropdownMenuItem
				label={entry.label ?? ''}
				onClick={entry.onClick ?? (() => {})}
				endContent={entry.endContentTestid != null ? endContent : undefined}
			/>
		{/if}
	{/each}
{/snippet}

<!--
	The two modes are a discriminated union, so the compound branch has to be a
	separate element: handing `menuContent={undefined}` to the data branch would
	not narrow.
-->
{#if compound != null}
	<ContextMenu {...props} {menuContent}>
		{#if isTriggerButton}
			<button type="button">{triggerText}</button>
		{:else}
			<div>{triggerText}</div>
		{/if}
	</ContextMenu>
{:else}
	<ContextMenu items={[]} {...props}>
		{#if isTriggerButton}
			<button type="button">{triggerText}</button>
		{:else}
			<div>{triggerText}</div>
		{/if}
	</ContextMenu>
{/if}
