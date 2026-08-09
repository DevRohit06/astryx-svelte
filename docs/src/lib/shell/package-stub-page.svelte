<script lang="ts">
	import { Divider, Text, VStack, parseOutlineFromMarkdown } from '@astryx-svelte/core';
	import DocPageLayout from './doc-page-layout.svelte';
	import MarkdownReadme from './markdown-readme.svelte';
	import PackageActions, { type InstallStep } from './package-actions.svelte';
	import type { OutlineEntry } from './outline.svelte';

	/**
	 * Upstream's `docs/PackageStubPage` — the second view `/docs/<slug>` serves:
	 * a package's README rendered through `Markdown`, with the on-this-page
	 * outline parsed out of the README's own headings.
	 *
	 * It was the last page in the v1 cut blocked on a component rather than on
	 * work: `Markdown` and `parseOutlineFromMarkdown` are the pair it is built
	 * from, and both landed in batch 11.
	 */

	/** TOC depth cap so deeply-nested README headings don't overwhelm the outline. */
	const MAX_OUTLINE_LEVEL = 3;

	interface Props {
		name: string;
		description?: string;
		version?: string;
		isReleased?: boolean;
		readme: string | null;
		installSteps?: InstallStep[];
		cta?: { label: string; href: string };
		/** Markdown section headings (`##` level) to strip from the README. */
		stripSections?: string[];
		/**
		 * Drop the README's leading intro prose (everything before the first `##`
		 * section). The canonical short description already renders as the page
		 * subtitle via `description`, so this avoids duplicating it — and removes
		 * any cross-references in the intro that point at stripped sections.
		 */
		stripIntro?: boolean;
	}

	const {
		name,
		description = undefined,
		version = undefined,
		isReleased = false,
		readme,
		installSteps = undefined,
		cta = undefined,
		stripSections = undefined,
		stripIntro = false
	}: Props = $props();

	const body = $derived.by(() => {
		let text = readme ? readme.replace(/^# .+\n+/, '') : null;

		if (text && stripIntro) {
			// Remove leading prose up to the first `##` section heading.
			text = text.replace(/^[\s\S]*?(?=\n## |^## )/, '').trimStart();
		}

		if (text && stripSections && stripSections.length > 0) {
			for (const section of stripSections) {
				// Remove `## Section` through to the next `##` or the end of the string.
				const pattern = new RegExp(
					`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n[\\s\\S]*?(?=\\n## |$)`
				);
				text = text.replace(pattern, '');
			}
			text = text.replace(/\n{3,}/g, '\n\n').trim();
		}

		return text;
	});

	// Heading outline derived from the README, in document order. The full list
	// assigns ids to every rendered heading; the display list is depth-capped.
	const headingItems = $derived(body ? parseOutlineFromMarkdown(body) : []);
	const outline = $derived<OutlineEntry[]>(
		headingItems.filter((item) => item.level <= MAX_OUTLINE_LEVEL)
	);

	/**
	 * Every heading's id, in document order — the full list, not the depth-capped
	 * one, because upstream assigns ids to all of them and caps only the display.
	 * `markdown-readme.svelte` hands them out as it renders; see
	 * `markdown-heading-ids.ts` for why they cannot be assigned afterwards here.
	 */
	const headingIds = $derived(headingItems.map((item) => item.id));
</script>

<DocPageLayout title={name} {description} outline={outline.length > 0 ? outline : []}>
	<VStack gap={10}>
		<PackageActions packageName={name} {version} {isReleased} {installSteps} {cta} />
		<Divider />
		{#if body}
			<!-- Keyed on the body so the heading-id cursor is recreated when the
			     README changes. SvelteKit reuses this component across a
			     `/docs/core` → `/docs/cli` navigation. -->
			{#key body}
				<MarkdownReadme {body} {headingIds} />
			{/key}
		{:else}
			<Text type="body" color="secondary">No README available.</Text>
		{/if}
	</VStack>
</DocPageLayout>
