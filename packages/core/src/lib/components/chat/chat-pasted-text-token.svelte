<script lang="ts" module>
	export interface ChatPastedTextTokenProps {
		/** The full pasted text. */
		text: string;
		/** Called when the user clicks Expand — dissolves the token into editable text. */
		onExpand?: () => void;
	}

	function formatLabel(text: string): string {
		const lines = text.split('\n').length;
		const chars = text.length;
		return lines > 1 ? `${lines} lines, ${chars} chars` : `${chars} chars`;
	}
</script>

<script lang="ts">
	import Badge from '../badge/badge.svelte';
	import Button from '../button/button.svelte';
	import HoverCard from '../hover-card/hover-card.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		pastedTextFooterAttrs,
		pastedTextMetaAttrs,
		pastedTextPreviewAttrs,
		pastedTextPreviewTextAttrs
	} from './chat-pasted-text-token.stylex.js';

	/**
	 * Inline token for pasted text, with a hover-card preview and an Expand
	 * button that dissolves the token back into editable text.
	 *
	 * Module-private on both sides — upstream's `Chat/index.ts` does not export
	 * it, and neither does ours; only `ChatComposerInput` renders one. The props
	 * interface is exported from the module block anyway, because that is where
	 * Svelte requires a component's props type to live and the file itself is not
	 * on the barrel.
	 *
	 * Upstream builds `cardContent` as a local `ReactNode` and passes it to
	 * `HoverCard.content`; here it is a snippet, which is the same thing in the
	 * position the prop already expects.
	 */
	const { text, onExpand }: ChatPastedTextTokenProps = $props();

	const t = useTranslator();
	const label = $derived(formatLabel(text));

	const preview = $derived(pastedTextPreviewAttrs());
	const previewText = $derived(pastedTextPreviewTextAttrs());
	const footer = $derived(pastedTextFooterAttrs());
	const meta = $derived(pastedTextMetaAttrs());
</script>

{#snippet cardContent()}
	<div class={preview.class} style={preview.style}>
		<div class={previewText.class} style={previewText.style}>{text}</div>
		<div class={footer.class} style={footer.style}>
			<span class={meta.class} style={meta.style}>{label}</span>
			{#if onExpand}
				<Button
					label={t('@astryx.chat.pastedText.expand')}
					variant="ghost"
					size="sm"
					onclick={onExpand}
				/>
			{/if}
		</div>
	</div>
{/snippet}

<HoverCard content={cardContent} placement="above" alignment="start" hasHoverIndication={false}>
	<Badge {label} variant="neutral" />
</HoverCard>
