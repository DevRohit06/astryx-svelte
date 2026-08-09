<!--
	Ported from upstream's `templates/blocks/components/Tab/TabWithSelectedIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors both SVGs in the block file itself, so there is no Heroicons
	substitution here — the two icon elements become snippets, which is what
	`Tab.icon`/`Tab.selectedIcon` take.
-->
<script lang="ts">
	import { Tab, TabList } from '@astryx-svelte/core';

	let value = $state('favorites');
</script>

{#snippet starIcon()}
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" width="100%" height="100%">
		<path d="m8 1.5 2 4.1 4.5.7-3.3 3.2.8 4.5-4-2.1L4 14l.8-4.5-3.3-3.2 4.5-.7L8 1.5Z" />
	</svg>
{/snippet}

{#snippet selectedStarIcon()}
	<svg viewBox="0 0 16 16" fill="currentColor" width="100%" height="100%">
		<path d="m8 1.5 2 4.1 4.5.7-3.3 3.2.8 4.5-4-2.1L4 14l.8-4.5-3.3-3.2 4.5-.7L8 1.5Z" />
	</svg>
{/snippet}

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="favorites" label="Favorites" icon={starIcon} selectedIcon={selectedStarIcon} />
	<Tab value="recent" label="Recent" />
</TabList>
