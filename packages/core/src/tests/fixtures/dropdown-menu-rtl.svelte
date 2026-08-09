<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';

	/**
	 * `DropdownMenu` under a `direction: rtl` ancestor — upstream's
	 * `<div style={{direction: 'rtl'}}>` wrapper. The `self-*` position-area
	 * keywords resolve against the popover's own inherited direction, so this
	 * exists to prove RTL emits the *same* logical mapping as LTR.
	 */
</script>

<div style="direction: rtl">
	<DropdownMenu button={{ label: 'Actions' }} items={[{ label: 'Item 1' }]} />
</div>
