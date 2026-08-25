<script lang="ts" module>
	import type { ChatComposerToken } from './chat-composer-input.svelte';

	/**
	 * Declared, not exported — and that is deliberate. Upstream types this
	 * component's props inline (`{token}: {token: ChatComposerToken}`) and
	 * `Chat/index.ts` publishes the component without a props type, so exporting
	 * a `ChatComposerTokenElementProps` here would invent a public name. The
	 * repo-wide "every component exports its props interface" convention exists
	 * because upstream publishes those types; where upstream does not, neither
	 * do we.
	 */
	interface ChatComposerTokenElementProps {
		token: ChatComposerToken;
	}
</script>

<script lang="ts">
	import Badge from '../badge/badge.svelte';
	import { isCustomToken } from './use-chat-composer-tokens.svelte.js';
	import { chatComposerInputTokenSpanAttrs } from './chat-composer-input.stylex.js';

	/**
	 * A standalone token chip in the shape `ChatComposerInput` inserts, for
	 * consumers rendering tokens outside the composer (stories, previews, a
	 * message body built by hand).
	 *
	 * The two declarations still have to match what `insertToken` writes onto the
	 * span it creates imperatively — that path cannot carry a compiled class —
	 * but upstream moved this one to a StyleX rule at 0.5.0, so the class is the
	 * source of truth and the imperative writer follows it.
	 */
	const { token }: ChatComposerTokenElementProps = $props();

	const tokenSpanAttrs = chatComposerInputTokenSpanAttrs();
</script>

<span
	data-astryx-token=""
	data-astryx-token-value={token.value}
	contenteditable="false"
	class={tokenSpanAttrs.class}
	style={tokenSpanAttrs.style}
>
	{#if isCustomToken(token)}
		{@render token.render()}
	{:else}
		<Badge label={token.label} variant={token.variant} icon={token.icon} />
	{/if}
</span>
