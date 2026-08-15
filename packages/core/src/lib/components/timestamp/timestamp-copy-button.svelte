<script lang="ts" module>
	/**
	 * Upstream declares `CopyButton` inline in `TimestampHoverCard.tsx` and keeps
	 * it module-private — nothing outside that file names it or its props. Svelte
	 * allows one component per file, so the private nested component becomes a
	 * private sibling file; the props type stays off `src/lib/index.ts` for the
	 * same reason upstream leaves it unexported.
	 */
	export interface TimestampCopyButtonProps {
		/** The row value written to the clipboard. */
		value: string;
	}
</script>

<script lang="ts">
	import { useClipboard } from '../../hooks/use-clipboard.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Icon from '../icon/icon.svelte';
	import IconButton from '../icon-button/icon-button.svelte';

	/**
	 * The per-row copy affordance: a compact ghost `IconButton` that writes the
	 * row's value to the clipboard, flips `copy` → `check` for a moment, and
	 * announces the copy to a polite live region (a swapped aria-label alone
	 * isn't reliably announced). A clipboard rejection is a silent no-op. All of
	 * that is `useClipboard` — shared with CodeBlock's built-in copy button.
	 *
	 * Kept as its own component so its state/timer/effect only exist for rows
	 * that actually opt into copying — read-only rows render no button and carry
	 * none of this machinery.
	 */
	const { value }: TimestampCopyButtonProps = $props();

	/** How long the copied checkmark stays before reverting to the copy icon. */
	const COPY_FEEDBACK_MS = 1500;

	const t = useTranslator();
	const clipboard = useClipboard(() => ({
		announce: t('@astryx.timestamp.copied'),
		resetAfterMs: COPY_FEEDBACK_MS
	}));

	function handleCopy(): void {
		void clipboard.copy(value);
	}

	// Constant — `themeProps` takes no visual props here, so there is nothing for
	// it to track.
	const theme = themeProps('timestamp-copy-button');
</script>

<IconButton
	variant="ghost"
	size="sm"
	tooltip={t(clipboard.isCopied ? '@astryx.timestamp.copied' : '@astryx.timestamp.copy')}
	label={clipboard.isCopied
		? t('@astryx.timestamp.copied')
		: t('@astryx.timestamp.copyValue', { value })}
	onclick={() => {
		void handleCopy();
	}}
	{...theme}
>
	<!--
		Visible hover/focus hint via Button's built-in tooltip: 'Copy', flipping to
		'Copied' after a successful copy in step with the icon. The full
		'Copy <value>' string stays the aria-label for assistive tech.
	-->
	{#snippet icon()}
		<Icon icon={clipboard.isCopied ? 'check' : 'copy'} size="sm" color="inherit" />
	{/snippet}
</IconButton>
