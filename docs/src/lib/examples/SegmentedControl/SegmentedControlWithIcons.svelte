<!--
	Ported from upstream's `templates/blocks/components/SegmentedControl/SegmentedControlWithIcons.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors all three SVGs in the block file itself, so there is no
	Heroicons substitution here — the icon components become snippets, which is
	what `SegmentedControlItem.icon` takes.
-->
<script lang="ts">
	import { SegmentedControl, SegmentedControlItem } from '@astryx-svelte/core';

	let value = $state('grid');
</script>

{#snippet gridIcon()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="3" y="3" width="7" height="7" rx="1" />
		<rect x="14" y="3" width="7" height="7" rx="1" />
		<rect x="3" y="14" width="7" height="7" rx="1" />
		<rect x="14" y="14" width="7" height="7" rx="1" />
	</svg>
{/snippet}

{#snippet listIcon()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<line x1="9" y1="6" x2="20" y2="6" />
		<line x1="9" y1="12" x2="20" y2="12" />
		<line x1="9" y1="18" x2="20" y2="18" />
		<circle cx="5" cy="6" r="1" fill="currentColor" />
		<circle cx="5" cy="12" r="1" fill="currentColor" />
		<circle cx="5" cy="18" r="1" fill="currentColor" />
	</svg>
{/snippet}

{#snippet tableIcon()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<line x1="3" y1="9" x2="21" y2="9" />
		<line x1="3" y1="15" x2="21" y2="15" />
		<line x1="9" y1="3" x2="9" y2="21" />
	</svg>
{/snippet}

<SegmentedControl {value} onChange={(next) => (value = next)} label="View mode">
	<SegmentedControlItem value="grid" label="Grid" icon={gridIcon} />
	<SegmentedControlItem value="list" label="List" icon={listIcon} />
	<SegmentedControlItem value="table" label="Table" icon={tableIcon} />
</SegmentedControl>
