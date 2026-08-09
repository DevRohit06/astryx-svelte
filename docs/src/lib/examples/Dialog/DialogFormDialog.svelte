<!--
	Ported from upstream's `templates/blocks/components/Dialog/DialogFormDialog.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's in-file `Content({onClose})` lives in the sibling
	`FormDialogContent.svelte` rather than becoming a parameterised snippet as the
	other three Dialog blocks' do — it holds `name`/`bio` state, and upstream
	renders it twice with an independent pair each. That file explains the split.

	`dialog.element` becomes `<ImperativeDialogLayer {dialog} />`, and the JSX
	upstream hands to `show()` becomes a zero-argument snippet — the two
	translations `useImperativeDialog` documents.
-->
<script lang="ts">
	import { Dialog, ImperativeDialogLayer, useImperativeDialog } from '@astryx-svelte/core';
	import FormDialogContent from './FormDialogContent.svelte';

	const dialog = useImperativeDialog(() => ({ purpose: 'form', width: 480 }));
</script>

{#snippet modalContent()}
	<FormDialogContent onClose={() => dialog.hide()} />
{/snippet}

<!-- Remove isInline for production — dialogs should be modal. -->
<Dialog isOpen isInline onOpenChange={() => {}} purpose="form" width={480}>
	<FormDialogContent onClose={() => dialog.show(modalContent)} />
</Dialog>
<ImperativeDialogLayer {dialog} />
