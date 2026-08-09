<!--
	Ported from upstream's `templates/blocks/components/AlertDialog/AlertDialogDeleteConfirmation.tsx`
	(the block targets both `AlertDialog` and `useImperativeAlertDialog`, so it is filed under each).
	Transcribed, not re-authored: the parity rule covers example content too.

	`alert.element` becomes `<ImperativeAlertDialogLayer {alert} />` — the
	render-returning-hook translation `useImperativeAlertDialog` documents.
	Upstream's `alertProps` object is shared between the inline preview and the
	`show()` call, so it is spread into both here as well.
-->
<script lang="ts">
	import {
		AlertDialog,
		ImperativeAlertDialogLayer,
		useImperativeAlertDialog
	} from '@astryx-svelte/core';

	const alert = useImperativeAlertDialog();

	const alertProps = {
		title: 'Delete item?',
		description:
			'This action cannot be undone. The item and all its data will be permanently removed.',
		actionLabel: 'Delete'
	} as const;
</script>

<!-- Remove isInline for production — alert dialogs should be modal. -->
<AlertDialog
	isOpen
	isInline
	onOpenChange={() => {}}
	{...alertProps}
	onAction={() => alert.show({ ...alertProps, onAction: () => alert.hide() })}
/>
<ImperativeAlertDialogLayer {alert} />
