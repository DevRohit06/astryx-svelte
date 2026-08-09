<!--
	Ported from upstream's `templates/blocks/components/DropdownMenuItem/DropdownMenuItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu, DropdownMenuItem } from '@astryx-svelte/core';
</script>

{#snippet pencilIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={1.5}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
		<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
	</svg>
{/snippet}

{#snippet copyIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={1.5}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="9" y="9" width="13" height="13" rx="2" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</svg>
{/snippet}

{#snippet shareIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={1.5}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="18" cy="5" r="3" />
		<circle cx="6" cy="12" r="3" />
		<circle cx="18" cy="19" r="3" />
		<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
		<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
	</svg>
{/snippet}

{#snippet trashIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={1.5}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<polyline points="3 6 5 6 21 6" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
	</svg>
{/snippet}

<DropdownMenu button={{ label: 'Actions' }}>
	<DropdownMenuItem
		icon={pencilIcon}
		label="Edit"
		description="Modify this item"
		onClick={() => {}}
	/>
	<DropdownMenuItem
		icon={copyIcon}
		label="Duplicate"
		description="Create a copy"
		onClick={() => {}}
	/>
	<DropdownMenuItem icon={shareIcon} label="Share" onClick={() => {}} />
	<DropdownMenuItem
		icon={trashIcon}
		label="Delete"
		description="This action cannot be undone"
		onClick={() => {}}
	/>
</DropdownMenu>
