<!--
	Ported from upstream's `templates/blocks/components/EmptyState/EmptyStateContainer.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, EmptyState, Icon } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `FolderPlusIcon`; the registry has no folder
	 * glyph, so this substitutes a built-in. Retires with the icon registry
	 * (port/todo.md).
	 */
</script>

<Card>
	<EmptyState
		title="No projects yet"
		description="Create your first project to start organizing your work. You can invite team members after."
	>
		{#snippet icon()}<Icon icon="copy" size="lg" />{/snippet}
		{#snippet actions()}
			<Button label="Import" variant="secondary" />
			<Button label="Create project" variant="primary" />
		{/snippet}
	</EmptyState>
</Card>
