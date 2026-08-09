<!--
	Ported from upstream's `templates/blocks/components/Dialog/DialogConfirmationDialog.tsx`
	(the block targets both `Dialog` and `useImperativeDialog`, so it is filed under each).
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream declares a `Content({onClose})` component in the same file and renders
	it twice — once inside the inline preview, once as the argument to
	`dialog.show(...)`. Svelte has no in-file component declaration, so it becomes a
	*parameterised snippet*: `onClose` is the parameter, and each call site keeps
	upstream's handler exactly. It is named `dialogContent` rather than `content` so
	it does not shadow the `content` snippet `Layout` takes. (The sibling-module
	translation `LinkProvider` needed is only necessary when the inner component
	holds state; this one does not — see `DialogFormDialog`, which does.)

	`dialog.element` becomes `<ImperativeDialogLayer {dialog} />`, and the JSX
	upstream hands to `show()` becomes a zero-argument snippet — the two
	translations `useImperativeDialog` documents.
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

	const dialog = useImperativeDialog(() => ({ width: 400, purpose: 'form' }));
</script>

{#snippet dialogContent(onClose: () => void)}
	<Layout>
		{#snippet header()}
			<DialogHeader title="Delete project?" onOpenChange={() => onClose()} />
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Text type="body">
					This will permanently delete "Marketing Dashboard" and all of its data. This action cannot
					be undone.
				</Text>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter>
				<HStack gap={2} hAlign="end">
					<Button label="Cancel" variant="secondary" onclick={onClose} />
					<Button label="Delete" variant="destructive" onclick={onClose} />
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
{/snippet}

{#snippet modalContent()}
	{@render dialogContent(() => dialog.hide())}
{/snippet}

<!-- Remove isInline for production — dialogs should be modal. -->
<Dialog isOpen isInline onOpenChange={() => {}} width={400} purpose="form">
	{@render dialogContent(() => dialog.show(modalContent))}
</Dialog>
<ImperativeDialogLayer {dialog} />
