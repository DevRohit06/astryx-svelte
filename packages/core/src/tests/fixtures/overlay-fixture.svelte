<script lang="ts">
	import Overlay from '$lib/components/overlay/overlay.svelte';
	import type { OverlayProps } from '$lib/components/overlay/overlay.svelte';

	/**
	 * An `Overlay` with text in both slots, since `children` and `content` are
	 * snippets and a case cannot author one.
	 */
	interface Props extends Omit<OverlayProps, 'children' | 'content'> {
		/** Base content, rendered under the scrim. */
		base?: string;
		/** Overlay content, rendered inside the scrim. */
		content?: string;
		/** Render the overlay content as a `<button>`, for the role queries. */
		isContentButton?: boolean;
	}

	const { base = 'base', content = 'c', isContentButton = false, ...rest }: Props = $props();
</script>

{#snippet baseSlot()}
	<div data-testid="base">{base}</div>
{/snippet}

{#snippet contentSlot()}
	{#if isContentButton}
		<button type="button">{content}</button>
	{:else}
		<span data-testid="ovl">{content}</span>
	{/if}
{/snippet}

<Overlay {...rest} content={contentSlot}>
	{@render baseSlot()}
</Overlay>
