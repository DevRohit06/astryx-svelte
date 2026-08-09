<script lang="ts" module>
	import type { MarkdownInlinePlugin } from '$lib/components/markdown/markdown-types.js';

	/** Which of the fixture's renderers a plugin draws its `render` from. */
	export type MarkdownPluginKind = 'ticket' | 'xref' | 'narrow' | 'broad' | 'bareTicket' | 'tag';

	/** A plugin minus its `render`, which the fixture supplies as a snippet. */
	export interface MarkdownPluginSpec {
		pattern: RegExp;
		getEndIndex?: MarkdownInlinePlugin['getEndIndex'];
		kind: MarkdownPluginKind;
	}
</script>

<script lang="ts">
	import Markdown from '$lib/components/markdown/markdown.svelte';

	/**
	 * `<Markdown inlinePlugins={…}>` with each plugin's `render` supplied as a
	 * snippet.
	 *
	 * Upstream writes `render: (match, key) => <a …>{match[0]}</a>` inline in the
	 * test file. Here `render` is a `Snippet<[RegExpMatchArray, string]>` and a
	 * snippet can only be authored in a template, so every renderer upstream's
	 * suite uses is declared below and a spec picks one by name. The `key`
	 * parameter is accepted by the component and ignored by these snippets, as it
	 * is upstream's React key and Svelte keys the `{#each}` itself.
	 */
	interface Props {
		/** The markdown string — `Markdown`'s `children`. */
		source: string;
		specs: MarkdownPluginSpec[];
	}

	const { source, specs }: Props = $props();
</script>

{#snippet ticket(match: RegExpMatchArray)}
	{@const href = `https://issues.example.com/browse/${match[1]}`}
	<a {href} data-testid="ticket-link">{match[0]}</a>
{/snippet}

{#snippet xref(match: RegExpMatchArray)}
	{@const href = `https://xref.example.com/${match[1]}`}
	<a {href} data-testid="xref-link">{match[0]}</a>
{/snippet}

{#snippet narrow(match: RegExpMatchArray)}
	<span data-testid="narrow-match">{match[0]}</span>
{/snippet}

{#snippet broad(match: RegExpMatchArray)}
	<span data-testid="broad-match">{match[0]}</span>
{/snippet}

<!-- Upstream's `skips matches when getEndIndex returns false` renders an <a> with
     no href, so it stands apart from `ticket`. Kept href-less, as upstream has
     it: the case asserts the anchor is never rendered at all. -->
{#snippet bareTicket(match: RegExpMatchArray)}
	<!-- svelte-ignore a11y_missing_attribute -->
	<a data-testid="ticket-link">{match[0]}</a>
{/snippet}

{#snippet tag(match: RegExpMatchArray)}
	<span data-testid="tag-match">{match[0]}</span>
{/snippet}

<Markdown
	children={source}
	inlinePlugins={specs.map((spec) => ({
		pattern: spec.pattern,
		getEndIndex: spec.getEndIndex,
		render:
			spec.kind === 'ticket'
				? ticket
				: spec.kind === 'xref'
					? xref
					: spec.kind === 'narrow'
						? narrow
						: spec.kind === 'broad'
							? broad
							: spec.kind === 'bareTicket'
								? bareTicket
								: tag
	}))}
/>
