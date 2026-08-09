<!--
	Ported from upstream's `templates/blocks/components/Toast/ToastShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Toast, useToast } from '@astryx-svelte/core';

	const toast = useToast();
</script>

<!-- In production, use useToast() hook for proper positioning, stacking, and lifecycle. -->
<Toast
	type="info"
	body="Document saved successfully"
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
			onclick={() => toast({ body: 'Document saved successfully' })}
		/>
	{/snippet}
</Toast>
