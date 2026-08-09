<!--
	Ported from upstream's `templates/blocks/components/EmptyState/EmptyStateActions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, EmptyState, Icon } from '@astryx-svelte/core';
</script>

<EmptyState
	title="No results found"
	description="Try adjusting your search terms or clearing filters to see more results."
>
	{#snippet icon()}<Icon icon="search" size="lg" />{/snippet}
	{#snippet actions()}
		<Button label="Go back" variant="secondary" />
		<Button label="Clear filters" variant="primary" />
	{/snippet}
</EmptyState>
