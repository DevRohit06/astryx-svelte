<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Heading } from '@astryx-svelte/core';
	import { takeHeadingId } from './markdown-heading-ids.js';

	/**
	 * Upstream's `PackageStubPage.MarkdownHeading` — the `components.heading`
	 * override that makes a README's headings read like the hand-authored docs
	 * rather than like `Markdown`'s default scale.
	 *
	 * `level` still picks the element, so the document outline is untouched;
	 * `type="display-3"` at levels 1–2 is the same treatment
	 * `reference-doc-view.svelte` gives a section heading (29px, not 20px), and
	 * deeper headings keep the standard scale.
	 *
	 * The block rhythm is upstream's two `stylex.create` entries — 24/12px for a
	 * major heading, 16/8px for a minor one — written as inline declarations
	 * rather than `xstyle`, because StyleX may not be imported from a `.svelte`
	 * file and a `.stylex.ts` for two margin pairs would buy nothing but a
	 * mandatory dev-server restart. The custom properties are the theme's own,
	 * so the values track a theme change exactly as upstream's `spacingVars` do.
	 *
	 * The `id` and its scroll offset are upstream's too, moved from a post-render
	 * DOM walk to render time — see `markdown-heading-ids.ts` for why the port
	 * cannot keep them in an effect. `scroll-margin-top` is the same expression
	 * every anchored section on the site uses.
	 */
	const { level, children }: { level: 1 | 2 | 3 | 4 | 5 | 6; children: Snippet } = $props();

	// Taken once, during initialisation — the position in the document is fixed,
	// so re-reading it on an update would hand out a second id.
	const id = takeHeadingId();

	const isMajor = $derived(level <= 3);
	const spacing = $derived(
		isMajor
			? 'margin-block-start: var(--spacing-6); margin-block-end: var(--spacing-3);'
			: 'margin-block-start: var(--spacing-4); margin-block-end: var(--spacing-2);'
	);
	const style = $derived(
		`${spacing} scroll-margin-top: calc(var(--appshell-header-height, 56px) + var(--docs-anchor-offset, 0px) + 16px);`
	);
</script>

<Heading {id} {level} type={level <= 2 ? 'display-3' : undefined} {style}>
	{@render children()}
</Heading>
