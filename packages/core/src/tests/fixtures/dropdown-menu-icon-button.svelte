<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';

	/**
	 * `DropdownMenu` whose trigger `button` carries an `icon` snippet (and, in the
	 * icon+label variant, a `children` snippet). Upstream writes these inline as
	 * `icon={<span data-testid="icon">⋯</span>}`; the Button's `icon`/`children`
	 * are `Snippet`s here, so they must be authored in a template.
	 */
	const { iconOnly = false }: { iconOnly?: boolean } = $props();
</script>

{#snippet icon()}<span data-testid="icon">{iconOnly ? '⋯' : '⚙️'}</span>{/snippet}
{#snippet settings()}Settings{/snippet}

{#if iconOnly}
	<DropdownMenu
		button={{ label: 'More options', icon, variant: 'ghost', isIconOnly: true }}
		items={[{ label: 'Edit' }, { label: 'Delete' }]}
	/>
{:else}
	<DropdownMenu
		button={{ label: 'Settings', icon, variant: 'ghost', children: settings }}
		items={[{ label: 'Preferences' }]}
	/>
{/if}
