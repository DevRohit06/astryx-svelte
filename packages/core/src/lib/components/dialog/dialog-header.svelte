<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface DialogHeaderProps extends BaseProps<HTMLDivElement> {
		/**
		 * The dialog title. Receives focus when a modal dialog opens, for screen
		 * reader accessibility.
		 */
		title: string;
		/** Optional subtitle below the title, in smaller secondary text. */
		subtitle?: string;
		/**
		 * Fired when the close button is clicked, with `false`. If omitted, no
		 * close button is rendered.
		 */
		onOpenChange?: (isOpen: boolean) => unknown;
		/** Content before the title (e.g. a back button). */
		startContent?: Snippet;
		/** Content after the title, before the close button (e.g. action buttons). */
		endContent?: Snippet;
		/**
		 * Adds a themed bottom border. Defaults to the parent `Layout`'s
		 * `defaultHasDividers` context value.
		 */
		hasDivider?: boolean;
	}
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import LayoutHeader, { type LayoutHeaderProps } from '../layout/layout-header.svelte';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import Heading from '../heading/heading.svelte';
	import Text from '../text/text.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useDialogContext } from './dialog-context.svelte.js';
	import {
		dialogHeaderContainerAttrs,
		dialogHeaderTitleWrapperAttrs,
		dialogHeaderActionsAttrs,
		titleFocusableStyle
	} from './dialog-header.stylex.js';

	/**
	 * A header built for `Dialog`. Renders a title that takes focus when a modal
	 * dialog opens (an `<h2>` with `tabindex="-1"`, focusable only programmatically)
	 * and an optional close button. Inline previews suppress the autofocus so they
	 * don't steal the page's scroll position. Wraps `LayoutHeader`.
	 *
	 * @example
	 * ```svelte
	 * <DialogHeader title="Delete file?" subtitle="This can't be undone." onOpenChange={close} />
	 * ```
	 */
	const {
		title,
		subtitle,
		onOpenChange,
		startContent,
		endContent,
		hasDivider,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DialogHeaderProps = $props();

	const t = useTranslator();
	const dialogContext = useDialogContext();
	const shouldAutoFocus = $derived(dialogContext()?.isInline !== true);
	// The parent `Dialog` detects this title by `titleId` from its own attachment
	// and points `aria-labelledby` at it — no registration handshake needed here.
	const titleId = $derived(dialogContext()?.titleId);

	let titleEl = $state<HTMLHeadingElement>();
	const titleAttachKey = createAttachmentKey();
	const titleAttach = {
		[titleAttachKey]: (element: HTMLHeadingElement) => {
			titleEl = element;
		}
	};

	// Auto-focus the title on mount for screen readers; suppressed inline.
	$effect(() => {
		if (shouldAutoFocus && titleEl) titleEl.focus();
	});

	const container = dialogHeaderContainerAttrs();
	const titleWrapper = dialogHeaderTitleWrapperAttrs();
	const startActions = dialogHeaderActionsAttrs(false);
	const endActions = $derived(dialogHeaderActionsAttrs(onOpenChange != null));
</script>

<LayoutHeader
	{hasDivider}
	{xstyle}
	class={className}
	style={styleProp}
	{...rest as LayoutHeaderProps}
>
	<div class={container.class} style={container.style}>
		{#if startContent}
			<div class={startActions.class} style={startActions.style}>{@render startContent()}</div>
		{/if}
		<div class={titleWrapper.class} style={titleWrapper.style}>
			<Heading id={titleId} level={2} tabindex={-1} xstyle={titleFocusableStyle} {...titleAttach}
				>{title}</Heading
			>
			{#if subtitle}
				<Text type="body" size="sm" color="secondary">{subtitle}</Text>
			{/if}
		</div>
		{#if endContent || onOpenChange}
			<div class={endActions.class} style={endActions.style}>
				{#if endContent}{@render endContent()}{/if}
				{#if onOpenChange}
					<Button
						variant="ghost"
						label={t('@astryx.dialog.close')}
						tooltip={t('@astryx.dialog.close')}
						isIconOnly
						onclick={() => onOpenChange?.(false)}
					>
						{#snippet icon()}<Icon icon="close" color="inherit" />{/snippet}
					</Button>
				{/if}
			</div>
		{/if}
	</div>
</LayoutHeader>
