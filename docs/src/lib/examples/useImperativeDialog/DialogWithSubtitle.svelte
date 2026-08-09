<!--
	Ported from upstream's `templates/blocks/components/Dialog/DialogWithSubtitle.tsx`
	(the block targets both `Dialog` and `useImperativeDialog`, so it is filed under each).
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's in-file `Content({onClose})` becomes a parameterised snippet, named
	`dialogContent` so it does not shadow the `content` snippet `Layout` takes —
	the same translation `DialogConfirmationDialog` documents.

	Note the header here takes no `onOpenChange`: upstream omits it, so the
	subtitle dialog has no close button, and `purpose="required"` blocks Escape and
	backdrop clicks too. That is upstream's example, transcribed.
-->
<script lang="ts">
	import {
		Button,
		Dialog,
		DialogHeader,
		HStack,
		ImperativeDialogLayer,
		Layout,
		LayoutContent,
		LayoutFooter,
		Text,
		useImperativeDialog
	} from '@astryx-svelte/core';

	const dialog = useImperativeDialog(() => ({ purpose: 'required' }));
</script>

{#snippet dialogContent(onClose: () => void)}
	<Layout>
		{#snippet header()}
			<DialogHeader
				title="Transfer project ownership"
				subtitle="This action requires confirmation from the new owner"
			/>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Text type="body">
					You are about to transfer "Marketing Dashboard" to Sarah Chen. Once accepted, you will
					lose admin access.
				</Text>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter>
				<HStack gap={2} hAlign="end">
					<Button label="Cancel" variant="secondary" onclick={onClose} />
					<Button label="Transfer" variant="primary" onclick={onClose} />
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
{/snippet}

{#snippet modalContent()}
	{@render dialogContent(() => dialog.hide())}
{/snippet}

<!-- Remove isInline for production — dialogs should be modal. -->
<Dialog isOpen isInline onOpenChange={() => {}} purpose="required">
	{@render dialogContent(() => dialog.show(modalContent))}
</Dialog>
<ImperativeDialogLayer {dialog} />
