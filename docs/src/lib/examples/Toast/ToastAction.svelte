<!--
	Ported from upstream's `templates/blocks/components/Toast/ToastAction.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Link, Toast, useToast, VStack } from '@astryx-svelte/core';

	const toast = useToast();
</script>

<!-- In production, use useToast() hook for proper positioning, stacking, and lifecycle. -->
<VStack gap={3}>
	<Toast
		type="info"
		body="Item deleted"
		isAutoHide={false}
		autoHideDuration={5000}
		isExiting={false}
		onDismiss={() => {}}
	>
		{#snippet endContent()}
			<Button
				label="Undo"
				variant="secondary"
				size="sm"
				onclick={() => toast({ body: 'Undo successful', type: 'info' })}
			/>
		{/snippet}
	</Toast>
	<Toast
		type="info"
		body="Your report is ready."
		isAutoHide={false}
		autoHideDuration={5000}
		isExiting={false}
		onDismiss={() => {}}
	>
		{#snippet endContent()}
			<Link href="#" hasUnderline>View report</Link>
		{/snippet}
	</Toast>
</VStack>
