<!--
	Ported from upstream's `templates/blocks/components/Toast/ToastDeduplication.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, Toast, useToast, VStack } from '@astryx-svelte/core';

	const toast = useToast();
</script>

<!-- In production, use useToast() hook for proper positioning, stacking, and lifecycle. -->
<VStack gap={3}>
	<Toast
		type="info"
		body="You are offline"
		isAutoHide={false}
		autoHideDuration={5000}
		isExiting={false}
		onDismiss={() => {}}
	/>
	<HStack gap={3} vAlign="center">
		<Button
			label="Offline (ignore)"
			variant="secondary"
			size="sm"
			onclick={() =>
				toast({
					body: 'You are offline',
					uniqueID: 'offline',
					collisionBehavior: 'ignore',
					isAutoHide: false
				})}
		/>
		<Button
			label="Progress (overwrite)"
			variant="secondary"
			size="sm"
			onclick={() =>
				toast({
					body: `Uploading… ${Math.floor(Math.random() * 100)}%`,
					uniqueID: 'upload-progress',
					collisionBehavior: 'overwrite',
					isAutoHide: false
				})}
		/>
	</HStack>
</VStack>
