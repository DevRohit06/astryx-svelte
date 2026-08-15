<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';

	/**
	 * Upstream's `CopyMenu`: a data-mode row that reports its own result in place
	 * (`hasCloseOnSelect: false`) by rewriting its own label. The state lives in a
	 * fixture because `render(DropdownMenu, …)` has no place to hold it — React
	 * writes the same component inline in the test file.
	 */
	const { onCopy = () => {} }: { onCopy?: () => void } = $props();

	let copied = $state(false);
</script>

<DropdownMenu
	button={{ label: 'Actions' }}
	items={[
		{
			label: copied ? 'Copied' : 'Copy ID',
			hasCloseOnSelect: false,
			onClick: () => {
				copied = true;
				onCopy();
			}
		},
		{ label: 'Rename' }
	]}
/>
