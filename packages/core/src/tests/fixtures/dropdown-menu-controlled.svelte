<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';

	/**
	 * Upstream's `Controlled`: `isMenuOpen` driven by local state that
	 * `onOpenChange` writes back. Held in a fixture for the same reason
	 * `dropdown-menu-copy-row.svelte` is — a bare `render(DropdownMenu, …)` has
	 * nowhere to keep the state.
	 */
	const { items }: { items: { label: string; isDisabled?: boolean }[] } = $props();

	let isOpen = $state(false);
</script>

<DropdownMenu
	button={{ label: 'Actions' }}
	{items}
	isMenuOpen={isOpen}
	onOpenChange={(open) => (isOpen = open)}
/>
