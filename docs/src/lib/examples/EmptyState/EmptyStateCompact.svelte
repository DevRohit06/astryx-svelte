<!--
	Ported from upstream's `templates/blocks/components/EmptyState/EmptyStateCompact.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, EmptyState, HStack, Icon } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `InboxIcon`; the registry has no inbox glyph, so
	 * this substitutes a built-in. Retires with the icon registry (TODO.md).
	 */
</script>

<EmptyState
	title="No notifications"
	description="You're all caught up. New notifications will appear here."
	isCompact
>
	{#snippet icon()}<Icon icon="info" size="lg" />{/snippet}
	{#snippet actions()}
		<HStack gap={2}>
			<Button label="Settings" variant="secondary" size="sm" />
			<Button label="Refresh" variant="primary" size="sm" />
		</HStack>
	{/snippet}
</EmptyState>
