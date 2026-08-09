<!--
	Ported from upstream's `templates/blocks/components/AlertDialog/AlertDialogAsyncAction.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AlertDialog } from '@astryx-svelte/core';

	let isLoading = $state(false);
</script>

<AlertDialog
	isOpen
	isInline
	onOpenChange={() => {}}
	title="Revoke access?"
	description="This user will immediately lose access to all shared resources."
	actionLabel="Revoke"
	isActionLoading={isLoading}
	onAction={async () => {
		isLoading = true;
		await new Promise((r) => setTimeout(r, 2000));
		isLoading = false;
	}}
/>
