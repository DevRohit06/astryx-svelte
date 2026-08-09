<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Text, useCollapsible, VStack } from '@astryx-svelte/core';

	/**
	 * `useCollapsible` takes its options as a getter — this port's standing shape
	 * for a hook whose options must stay live. Upstream's `useId` is
	 * `$props.id()`.
	 */
	const detailsId = $props.id();

	const disclosure = useCollapsible(() => ({
		isCollapsible: { defaultIsOpen: true },
		value: 'release-notes'
	}));
</script>

<Card width={360} padding={4}>
	<VStack gap={3}>
		<Text type="body" weight="bold">Release checklist</Text>
		<Button
			label={disclosure.isOpen ? 'Hide details' : 'Show details'}
			variant="secondary"
			aria-controls={detailsId}
			aria-expanded={disclosure.isOpen}
			onclick={disclosure.toggle}
		/>
		{#if disclosure.isOpen}
			<div id={detailsId} role="region" aria-label="Release checklist details">
				<Text type="body" color="secondary">
					Review docs, run visual checks, and confirm keyboard behavior before shipping the
					component update.
				</Text>
			</div>
		{/if}
	</VStack>
</Card>
