<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ChatComposerToken } from './chat-composer-input.svelte';

	export interface ChatTokenizedTextProps extends BaseProps<HTMLSpanElement> {
		/** The message text containing serialized token values. */
		children: string;
		/**
		 * Token definitions — the same type returned by trigger `onSelect`. Each
		 * token's `value` is matched against the text and replaced with its badge
		 * representation (label, variant, icon).
		 *
		 * @example
		 * ```svelte
		 * <script lang="ts">
		 *   const mentionTokens = contacts.map((c) => ({
		 *     value: `@${c.id}`,
		 *     label: `@${c.label}`,
		 *     variant: 'blue' as const
		 *   }));
		 * <\/script>
		 *
		 * <ChatTokenizedText tokens={mentionTokens}>{message.text}</ChatTokenizedText>
		 * ```
		 */
		tokens?: ChatComposerToken[];
	}

	/**
	 * Upstream declares its own local copy of this guard rather than importing
	 * `useChatComposerTokens`'s, and the duplication is kept: importing here
	 * would pull a stateful `.svelte.ts` module into a component that needs no
	 * state, for one three-line predicate.
	 */
	function isCustomToken(token: ChatComposerToken): token is { value: string; render: Snippet } {
		return 'render' in token && typeof token.render === 'function';
	}

	function escapeRegExp(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/** One rendered piece: a literal run of text, or a matched token. */
	type TokenPart =
		| { kind: 'text'; key: string; text: string }
		| { kind: 'token'; key: string; token: ChatComposerToken };

	/**
	 * Upstream's `renderTokens`, returning data instead of markup.
	 *
	 * The regex walk is verbatim; only the `parts.push(<Badge …/>)` calls become
	 * `{kind: 'token'}` entries the template renders, because a Svelte module
	 * script cannot produce markup. `key` reproduces upstream's
	 * `` `${matched}-${match.index}` `` so the two sides key their lists the same
	 * way, and text runs carry their own index for the same reason.
	 */
	function renderTokens(text: string, tokens: ChatComposerToken[]): TokenPart[] {
		const pattern = tokens.map((t) => escapeRegExp(t.value)).join('|');
		const regex = new RegExp(`(${pattern})`, 'g');

		// Built fresh inside a pure function and never read reactively — the
		// `SvelteMap` this rule wants would only add proxy overhead.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const tokenMap = new Map<string, ChatComposerToken>();
		for (const t of tokens) {
			tokenMap.set(t.value, t);
		}

		const parts: TokenPart[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push({
					kind: 'text',
					key: `text-${lastIndex}`,
					text: text.slice(lastIndex, match.index)
				});
			}

			const matched = match[0];
			const token = tokenMap.get(matched);
			if (token) {
				parts.push({ kind: 'token', key: `${matched}-${match.index}`, token });
			}

			lastIndex = match.index + matched.length;
		}

		if (lastIndex < text.length) {
			parts.push({ kind: 'text', key: `text-${lastIndex}`, text: text.slice(lastIndex) });
		}

		return parts;
	}
</script>

<script lang="ts">
	import Badge from '../badge/badge.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { chatTokenizedTextAttrs } from './chat-tokenized-text.stylex.js';

	/**
	 * Renders text with token values replaced by inline badges.
	 *
	 * Accepts the same `ChatComposerToken` type used by input triggers, so a
	 * single token definition can be shared between input and display.
	 *
	 * Upstream returns early with a second, identical `<span>` when there is
	 * nothing to tokenize; here one element covers both, because the `{#if}` that
	 * chooses between the raw string and the parts list sits *inside* it. The
	 * rendered DOM is the same either way — upstream's two returns differ only in
	 * their children.
	 */
	const {
		children,
		tokens,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatTokenizedTextProps = $props();

	const attrs = $derived(chatTokenizedTextAttrs(xstyle));
	const theme = themeProps('chat-tokenized-text');

	const hasTokens = $derived(Boolean(children) && tokens != null && tokens.length > 0);
	const parts = $derived(hasTokens ? renderTokens(children, tokens!) : []);
</script>

<span
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{#if !hasTokens}
		{children ?? ''}
	{:else}
		{#each parts as part (part.key)}
			{#if part.kind === 'text'}
				{part.text}
			{:else if isCustomToken(part.token)}
				<span>{@render part.token.render()}</span>
			{:else}
				<Badge label={part.token.label} variant={part.token.variant} icon={part.token.icon} />
			{/if}
		{/each}
	{/if}
</span>
