<script lang="ts">
	import { Code } from '@astryx-svelte/core';
	import { parseInlineMarkdown } from './inline-markdown.js';

	/** Renders the segments `parseInlineMarkdown` produces. */
	const { text }: { text: string } = $props();

	const segments = $derived(parseInlineMarkdown(text));
</script>

{#each segments as segment, i (i)}
	{#if segment.kind === 'text'}{segment.text}{:else if segment.kind === 'code'}<Code
			>{segment.text}</Code
		>{:else}<a
			class="inline-link"
			href={segment.href}
			rel={segment.isExternal ? 'noreferrer noopener' : undefined}
			target={segment.isExternal ? '_blank' : undefined}>{segment.label}</a
		>{/if}
{/each}

<style>
	.inline-link {
		color: var(--color-text-accent);
		text-decoration-line: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.16em;
		transition:
			color 120ms ease,
			text-decoration-color 120ms ease;
	}

	@media (hover: hover) {
		.inline-link:hover {
			color: var(--color-accent);
			text-decoration-thickness: 2px;
		}
	}

	.inline-link:focus-visible {
		border-radius: var(--radius-sm);
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
