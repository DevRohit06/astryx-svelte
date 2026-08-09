<!--
	Ported from upstream's `templates/blocks/components/EmptyState/EmptyStateShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, EmptyState, Icon } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `MagnifyingGlassIcon`; the registry ships
	 * `search`, so this is a direct swap rather than an approximation.
	 */
</script>

<EmptyState
	title="No results found"
	description="Try adjusting your search or filters to find what you need."
>
	{#snippet icon()}<Icon icon="search" size="lg" />{/snippet}
	{#snippet actions()}<Button label="Clear filters" variant="secondary" />{/snippet}
</EmptyState>
