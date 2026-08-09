<!--
	Ported from upstream's `templates/blocks/components/TreeList/TreeListInteractiveSettings.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, TreeList } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Cog6ToothIcon` and `ChevronRightIcon`. The
	 * registry's `chevronRight` is a true match; it ships no cog, so that one
	 * substitutes a built-in and retires with the icon registry (TODO.md).
	 */
</script>

{#snippet cogIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet chevronRightIcon()}<Icon icon="chevronRight" size="sm" />{/snippet}

<TreeList
	items={[
		{
			id: 'settings',
			label: 'Settings',
			isExpanded: true,
			startContent: cogIcon,
			children: [
				{ id: 'general', label: 'General', onClick: () => {} },
				{ id: 'advanced', label: 'Advanced', onClick: () => {} }
			]
		},
		{ id: 'docs', label: 'Documentation', href: '#', endContent: chevronRightIcon }
	]}
/>
