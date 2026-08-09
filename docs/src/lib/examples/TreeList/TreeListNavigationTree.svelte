<!--
	Ported from upstream's `templates/blocks/components/TreeList/TreeListNavigationTree.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TreeList } from '@astryx-svelte/core';

	const noop = () => {};
</script>

<TreeList
	items={[
		{
			id: 'nav',
			label: 'Navigation',
			isExpanded: true,
			children: [
				{ id: 'home', label: 'Home', onClick: noop },
				{ id: 'about', label: 'About', onClick: noop, isSelected: true },
				{ id: 'contact', label: 'Contact', onClick: noop }
			]
		}
	]}
/>
