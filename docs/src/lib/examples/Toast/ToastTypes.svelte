<!--
	Ported from upstream's `templates/blocks/components/Toast/ToastTypes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Toast, useToast, VStack } from '@astryx-svelte/core';

	const toast = useToast();
</script>

<!-- In production, use useToast() hook for proper positioning, stacking, and lifecycle. -->
<VStack gap={3}>
	<Toast
		type="info"
		body="Changes saved successfully."
		isAutoHide={false}
		autoHideDuration={5000}
		isExiting={false}
		onDismiss={() => {}}
	>
		{#snippet endContent()}
			<Button
				label="Show toast"
				variant="ghost"
				size="sm"
				onclick={() => toast({ body: 'Changes saved successfully.', type: 'info' })}
			/>
		{/snippet}
	</Toast>
	<Toast
		type="error"
		body="Failed to save changes."
		isAutoHide={false}
		autoHideDuration={5000}
		isExiting={false}
		onDismiss={() => {}}
	>
		{#snippet endContent()}
			<Button
				label="Show toast"
				variant="ghost"
				size="sm"
				onclick={() => toast({ body: 'Failed to save changes.', type: 'error' })}
			/>
		{/snippet}
	</Toast>
</VStack>
