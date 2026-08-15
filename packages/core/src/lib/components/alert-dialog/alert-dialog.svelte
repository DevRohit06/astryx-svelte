<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { ButtonVariant } from '../button/button.stylex.js';

	export interface AlertDialogProps extends BaseProps<HTMLDialogElement> {
		/** Whether the dialog is open. */
		isOpen: boolean;
		/**
		 * Renders alert dialog content inline without modal behavior.
		 * For documentation previews and showcases only.
		 * @default false
		 */
		isInline?: boolean;
		/**
		 * Fired when the dialog visibility changes. Called with `false` when cancel
		 * is clicked or Escape is pressed.
		 */
		onOpenChange: (isOpen: boolean) => unknown;
		/** Dialog title. Linked to the dialog via `aria-labelledby`. */
		title: string;
		/** Consequence description. Linked to the dialog via `aria-describedby`. */
		description: string;
		/**
		 * Label for the cancel button. Clicking it calls `onOpenChange(false)`.
		 * @default 'Cancel'
		 */
		cancelLabel?: string;
		/** Label for the action button. */
		actionLabel: string;
		/**
		 * @default 'destructive'
		 */
		actionVariant?: ButtonVariant;
		/** Whether the action button shows a loading spinner. */
		isActionLoading?: boolean;
		/**
		 * Fired when the action button is clicked. The dialog does **not**
		 * auto-close — call `onOpenChange(false)` when done.
		 */
		onAction: () => unknown;
		/**
		 * Width of the dialog. Numbers are pixels, strings pass through.
		 * @default 400
		 */
		width?: number | string;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Dialog from '../dialog/dialog.svelte';
	import Heading from '../heading/heading.svelte';
	import HStack from '../stack/hstack.svelte';
	import Layout from '../layout/layout.svelte';
	import LayoutContent from '../layout/layout-content.svelte';
	import LayoutFooter from '../layout/layout-footer.svelte';
	import Text from '../text/text.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/**
	 * A confirmation dialog for destructive or irreversible actions.
	 *
	 * Uses `role="alertdialog"` and requires explicit user action to dismiss: it
	 * cannot be dismissed by clicking outside, and Escape triggers cancel. Initial
	 * focus goes to the cancel button — the least destructive action.
	 *
	 * The inline preview is the exception, and takes `role="group"` instead
	 * (#4887): `alertdialog` is a *modal* role, promising an interruption the
	 * user has to deal with, a focus trap, and an inert page behind it. The
	 * inline path renders a plain always-present div with none of that, so the
	 * role would misdescribe it. `group` keeps the title and description
	 * associated with a container without claiming a dialog.
	 *
	 * @example
	 * ```svelte
	 * <AlertDialog
	 *   isOpen={isOpen}
	 *   onOpenChange={(open) => (isOpen = open)}
	 *   title="Delete item?"
	 *   description="This action cannot be undone."
	 *   actionLabel="Delete"
	 *   onAction={async () => { await deleteItem(); isOpen = false; }}
	 * />
	 * ```
	 */
	let {
		isOpen,
		isInline,
		onOpenChange,
		title,
		description,
		cancelLabel: cancelLabelFromProps,
		actionLabel,
		actionVariant = 'destructive',
		isActionLoading,
		onAction,
		width = 400,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: AlertDialogProps = $props();

	const t = useTranslator();
	const cancelLabel = $derived(cancelLabelFromProps ?? t('@astryx.alertDialog.cancel'));

	// Upstream mints two `useId`s; `$props.id()` may be called only once per
	// component, so the pair is derived from one — the same shape `InputGroup`
	// and `RadioListItem` already use.
	const uid = $props.id();
	const titleId = `${uid}-title`;
	const descriptionId = `${uid}-description`;

	const theme = themeProps('alert-dialog');

	const dialogRole = $derived(isInline ? 'group' : 'alertdialog');

	function handleCancel(): void {
		onOpenChange(false);
	}
</script>

{#snippet content()}
	<LayoutContent>
		<Heading level={2} id={titleId}>{title}</Heading>
		<Text type="body" color="secondary" id={descriptionId}>{description}</Text>
	</LayoutContent>
{/snippet}

{#snippet footer()}
	<LayoutFooter>
		<HStack gap={2} hAlign="end">
			<!--
			Dialog focuses `[data-autofocus]` itself after `showModal()`, because the
			native `autofocus` attribute runs while the dialog is still invisible.
			Cancel is the least destructive choice, so it is the one preselected.
		-->
			<Button variant="ghost" label={cancelLabel} onclick={handleCancel} data-autofocus />
			<Button
				variant={actionVariant}
				label={actionLabel}
				onclick={onAction}
				isLoading={isActionLoading}
			/>
		</HStack>
	</LayoutFooter>
{/snippet}

<Dialog
	{...rest}
	{isOpen}
	{isInline}
	{onOpenChange}
	{width}
	purpose="form"
	role={dialogRole}
	aria-labelledby={titleId}
	aria-describedby={descriptionId}
	class={cx(theme.class, className)}
	style={styleProp}
	{xstyle}
	data-testid={testId}
>
	<Layout {content} {footer} />
</Dialog>
