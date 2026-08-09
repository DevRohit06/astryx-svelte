<!--
	Ported from upstream's `templates/blocks/components/Toast/ToastStacking.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Toast, useToast, VStack } from '@astryx-svelte/core';

	const MESSAGES = [
		{ body: 'Changes saved.', type: 'info' as const },
		{ body: 'Failed to upload file.', type: 'error' as const },
		{ body: 'Message sent to Sarah Chen.', type: 'info' as const }
	];

	const toast = useToast();

	/**
	 * Upstream's `countRef` is a `useRef`; nothing renders from it, so a plain
	 * `let` is the counterpart.
	 */
	let count = 0;
</script>

<!-- In production, use useToast() hook for proper positioning, stacking, and lifecycle. -->
<VStack gap={3}>
	{#each MESSAGES as msg (msg.body)}
		<Toast
			type={msg.type}
			body={msg.body}
			isAutoHide={false}
			autoHideDuration={5000}
			isExiting={false}
			onDismiss={() => {}}
		/>
	{/each}
	<Button
		label="Show toast"
		variant="secondary"
		size="sm"
		onclick={() => {
			const msg = MESSAGES[count % MESSAGES.length];
			count++;
			toast(msg);
		}}
	/>
</VStack>
