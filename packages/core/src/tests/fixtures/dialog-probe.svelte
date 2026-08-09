<script lang="ts">
	import Dialog, { type DialogProps } from '$lib/components/dialog/dialog.svelte';
	import DialogHeader from '$lib/components/dialog/dialog-header.svelte';

	/**
	 * Renders `Dialog` with an arbitrary prop bag and one of a few body shapes —
	 * the smallest thing that can hand `Dialog` a `children` snippet, since a
	 * snippet can only be authored in a template. Upstream writes the body inline
	 * as JSX; here `body` selects which markup the snippet renders.
	 */
	interface Props {
		// The Dialog props, spread onto `<Dialog>`. `Record<string, any>` for the
		// same contravariance reason the shared probes give, and so the `open`
		// leak case can pass a prop that is not on `DialogProps`.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props: Record<string, any>;
		/** Which body to render inside the dialog. */
		body?: 'text' | 'child' | 'header';
		/** Text for the `text` and `child` bodies. */
		text?: string;
		/** Title for the `header` body. */
		headerTitle?: string;
		/**
		 * Renders a `<span id="external-label">` *outside* the dialog, for the
		 * accessible-name case that points `aria-labelledby` at a foreign element.
		 * Upstream writes it as a JSX fragment sibling.
		 */
		externalLabel?: string;
	}

	const {
		props,
		body = 'text',
		text = 'Dialog content',
		headerTitle = 'Inline title',
		externalLabel
	}: Props = $props();
</script>

{#if externalLabel !== undefined}
	<span id="external-label">{externalLabel}</span>
{/if}
<Dialog {...props as Omit<DialogProps, 'children'>}>
	{#if body === 'text'}
		{text}
	{:else if body === 'child'}
		<div data-testid="child">{text}</div>
	{:else if body === 'header'}
		<DialogHeader title={headerTitle} />
	{/if}
</Dialog>
