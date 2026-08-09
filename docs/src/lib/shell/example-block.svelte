<script lang="ts">
	import { Card, CodeBlock, Section, Tab, TabList, Text } from '@astryx-svelte/core';
	import ExamplePreview from './example-preview.svelte';
	import InlineMarkdown from './inline-markdown.svelte';
	import { sourceImporterFor, stripPortingNote } from './example-modules.js';
	import type { ExampleEntry } from '$lib/generated/types.js';

	/**
	 * One example on a component page — upstream's `ExampleBlock`.
	 *
	 * The shape is upstream's: a `Card padding={3}` holding the example's name,
	 * the live preview, and then a muted footer split in two — a top-divided
	 * strip carrying a small `TabList`, and the panel it switches. Description is
	 * the default tab, which is why the server can render this without ever
	 * fetching source.
	 *
	 * Two upstream pieces have no counterpart here:
	 *
	 * - **"Open in Playground"**, the second child of the strip's `HStack`. The
	 *   playground is a Monaco-backed live editor route this port does not have,
	 *   so the button would link nowhere. With it gone the `HStack` has one child
	 *   and `space-between` no longer means anything, so the `TabList` sits in the
	 *   strip directly.
	 * - **`ComponentPreviewTheme`**, the nested `<Theme>` upstream wraps each
	 *   block in. It exists to stop the type-scale override on its Overview prose
	 *   from leaking into previews; the root layout's `<Theme>` already covers
	 *   this page and nothing here overrides the type scale, so a second identical
	 *   theme boundary would be a no-op.
	 */
	interface Props {
		entry: ExampleEntry;
	}

	const { entry }: Props = $props();

	let tab = $state('description');

	/**
	 * The source, fetched on first switch to the Code tab rather than in an
	 * effect: the trigger is a user action, not a state dependency, so an effect
	 * would only re-derive what the handler already knows.
	 */
	let source = $state<string | null>(null);
	let hasSourceFailed = $state(false);

	async function loadSource(): Promise<void> {
		if (source !== null || hasSourceFailed) return;
		const importer = entry.hasSvelte ? sourceImporterFor(entry.id) : null;
		if (!importer) {
			hasSourceFailed = true;
			return;
		}
		try {
			source = stripPortingNote(await importer());
		} catch {
			hasSourceFailed = true;
		}
	}

	function handleTabChange(value: string): void {
		tab = value;
		if (value === 'code') void loadSource();
	}
</script>

<Card padding={3}>
	<Text type="body" weight="medium">{entry.name}</Text>

	<ExamplePreview id={entry.id} hasSvelte={entry.hasSvelte} />

	<Section variant="muted" padding={1} dividers={['top']}>
		<TabList value={tab} onChange={handleTabChange} size="sm">
			<Tab value="description" label="Description" />
			<Tab value="code" label="Code" />
		</TabList>
	</Section>

	<Section variant="muted" padding={tab === 'code' ? 0 : 4}>
		{#if tab === 'description'}
			<Text type="body">
				<InlineMarkdown text={entry.description || 'No description available.'} />
			</Text>
		{:else if source !== null}
			<CodeBlock code={source} language="svelte" hasCopyButton container="section" width="100%" />
		{:else}
			<div class="code-status">
				<Text type="supporting" color="secondary">
					{hasSourceFailed ? 'Source not available for this example.' : 'Loading source…'}
				</Text>
			</div>
		{/if}
	</Section>
</Card>

<style>
	/* Only ever occupies the panel while the source chunk is in flight, so it
	   matches the `padding={4}` the description tab uses rather than the
	   `padding={0}` the code tab switches to. */
	.code-status {
		padding: var(--spacing-4);
	}
</style>
