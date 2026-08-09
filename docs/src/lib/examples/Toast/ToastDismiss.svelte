<!--
	Ported from upstream's `templates/blocks/components/Toast/ToastDismiss.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, Toast, useToast, VStack } from '@astryx-svelte/core';
	import type { ToastDismissFn } from '@astryx-svelte/core';

	const toast = useToast();

	/**
	 * Upstream holds the dismiss function in a `useRef`. Nothing renders from it,
	 * so the counterpart is a plain `let` — a `$state` would only add a needless
	 * re-render on a value the template never reads.
	 */
	let dismiss: ToastDismissFn | null = null;
</script>

<!-- In production, use useToast() hook for proper positioning, stacking, and lifecycle. -->
<VStack gap={3}>
	<Toast
		type="info"
		body="Uploading file…"
		isAutoHide={false}
		autoHideDuration={5000}
		isExiting={false}
		onDismiss={() => {}}
	/>
	<HStack gap={3} vAlign="center">
		<Button
			label="Show toast"
			variant="secondary"
			size="sm"
			onclick={() => {
				dismiss = toast({ body: 'Uploading file…', isAutoHide: false });
			}}
		/>
		<Button
			label="Dismiss via code"
			variant="ghost"
			size="sm"
			onclick={() => {
				dismiss?.();
				dismiss = null;
			}}
		/>
	</HStack>
</VStack>
