<script lang="ts">
	import {
		Card,
		CodeBlock,
		Heading,
		HStack,
		Icon,
		List,
		ListItem,
		Table,
		Text,
		VStack,
		getIconRegistry,
		pixel,
		proportional,
		type IconName,
		type TableColumn
	} from '@astryx-svelte/core';
	import docsRegistry from '$lib/generated/docs-registry.js';
	import type { ContentBlock } from '$lib/generated/types.js';
	import InlineMarkdown from './inline-markdown.svelte';
	import { topicSectionHref } from './links.js';
	import { sectionId } from './section-id.js';
	import TokenTable from './token-table.svelte';
	import Self from './content-block.svelte';

	/**
	 * Upstream's `ContentBlockRenderer` — the six authored block types a
	 * `ReferenceDoc` section is built from — over its `ProseBlock`, `ListBlock`
	 * and `TableBlock`.
	 *
	 * Two blocks take a section's `previewType` into account:
	 *
	 * - A **`table`** in a section that declares one is a *token* table, and
	 *   renders through `TokenTable`, which picks one of upstream's twelve column
	 *   shapes. Upstream reaches the same place by mapping section titles to
	 *   eight hand-written table components in `TokensDocView`. Any other table is
	 *   upstream's `TableBlock`: a `Card` around a real `Table`.
	 * - A **`token-ref`** names a section of the `tokens` topic instead of
	 *   carrying content, and is rendered by **inlining** that section's blocks —
	 *   which is what upstream's section-title override does. Falling back to a
	 *   link would leave `/docs/color` with no colour table at all.
	 *
	 * **`do`/`dont` lists carry no badge here, and that is upstream's rendering.**
	 * A section made *only* of them is lifted to a `BestPracticesBlock` by the
	 * route (upstream's `isBestPracticesSection`); what is left is the three
	 * sections that mix one with prose, and upstream's `ListBlock` resolves any
	 * style that is not `ordered`/`unordered` to marker `none` and renders a plain
	 * `List`. Measured on astryx.atmeta.com/docs/layout → "Cards vs Rows": two
	 * `.astryx-list.compact.none` lists and **0 `.astryx-badge`**. The badge list
	 * this replaced was invented decoration.
	 */
	interface Props {
		block: ContentBlock;
		/** The owning section's `previewType`, when it declares one. */
		previewType?: string;
		/**
		 * Anchor id for a `heading` block, minted by `buildOutline` so it is unique
		 * across the page. Absent for every other block type.
		 */
		headingId?: string;
	}

	const { block, previewType, headingId }: Props = $props();

	/** The section a `token-ref` points at, when it resolves. */
	const referenced = $derived.by(() => {
		if (block.type !== 'token-ref') return null;
		const topic = docsRegistry.find((entry) => entry.name === block.topic);
		return topic?.sections.find((section) => section.title === block.section) ?? null;
	});

	// --- table ---------------------------------------------------------------

	/** Upstream's `semanticIconNames` — the built-in registry's key set. */
	const iconNames = new Set<string>(Object.keys(getIconRegistry()));

	// `Table`'s row generic is constrained to `Record<string, unknown>`; extending
	// it is how `token-table.ts` satisfies that for its own row shapes.
	interface TableRow extends Record<string, unknown> {
		/** Cell text by column index. Keyed by position, not by header. */
		cells: string[];
		/** The `Name` cell's text, when the table has a `Name` column. */
		nameValue: string;
		/** Set when that text is a registry icon name — upstream's `isIconName`. */
		iconName?: IconName;
	}

	const tableData = $derived.by<TableRow[]>(() => {
		if (block.type !== 'table') return [];
		const nameIndex = block.headers.indexOf('Name');
		return block.rows.map((row) => {
			const nameValue = nameIndex < 0 ? '' : (row[nameIndex] ?? '');
			return {
				cells: block.headers.map((_, j) => row[j] ?? ''),
				nameValue,
				iconName: iconNames.has(nameValue) ? (nameValue as IconName) : undefined
			};
		});
	});

	/**
	 * `renderCell` is a `Snippet<[T]>`, so a cell snippet cannot be told which
	 * column it is rendering — it only ever receives the row. Upstream closes over
	 * `h` in a `.map()`; the Svelte equivalent is one snippet per column position,
	 * reading `cells[i]`. **Six are declared and the widest authored table has
	 * four** (`browser-support`); a seventh column would render its raw string
	 * through `Table`'s own default cell rather than through `InlineMarkdown`,
	 * which degrades to unstyled text instead of dropping the column.
	 */
	const cellSnippets = $derived.by(() => [cell0, cell1, cell2, cell3, cell4, cell5]);

	const tableColumns = $derived.by<TableColumn<TableRow>[]>(() => {
		if (block.type !== 'table') return [];
		return block.headers.map((header, i) => ({
			key: `c${i}`,
			header,
			// Upstream's note, and the reason every column is sized: without a
			// min-width floor a text-heavy column squishes to near-zero and
			// character-wraps on a narrow viewport; with one, the table's scroll
			// wrapper takes over instead. `Name` is a fixed reference column.
			width: header === 'Name' ? pixel(220) : proportional(1),
			renderCell: header === 'Name' ? nameCell : cellSnippets[i]
		}));
	});
</script>

<!--
	Upstream's `TableBlock` cells. `renderCellContent` gives a `Name` column whose
	value is a registry icon name the glyph beside a code label, and every other
	cell a `Text` around the inline markdown.
-->
{#snippet nameCell(item: TableRow)}
	{#if item.iconName}
		<HStack gap={2} vAlign="center">
			<Icon icon={item.iconName} size="sm" color="secondary" />
			<Text type="code" maxLines={1}>{item.nameValue}</Text>
		</HStack>
	{:else}
		<Text><InlineMarkdown text={item.nameValue} /></Text>
	{/if}
{/snippet}

{#snippet cell0(item: TableRow)}<Text><InlineMarkdown text={item.cells[0] ?? ''} /></Text>{/snippet}
{#snippet cell1(item: TableRow)}<Text><InlineMarkdown text={item.cells[1] ?? ''} /></Text>{/snippet}
{#snippet cell2(item: TableRow)}<Text><InlineMarkdown text={item.cells[2] ?? ''} /></Text>{/snippet}
{#snippet cell3(item: TableRow)}<Text><InlineMarkdown text={item.cells[3] ?? ''} /></Text>{/snippet}
{#snippet cell4(item: TableRow)}<Text><InlineMarkdown text={item.cells[4] ?? ''} /></Text>{/snippet}
{#snippet cell5(item: TableRow)}<Text><InlineMarkdown text={item.cells[5] ?? ''} /></Text>{/snippet}

{#if block.type === 'prose'}
	<!--
		Upstream's `ProseBlock`: `Text as="p" display="block"`. It used to be a bare
		`<p>` with `line-height: var(--line-height-body, 1.6)` — a custom property
		no theme in this repo declares, so every paragraph fell back to 1.6 (27.2px)
		where upstream inherits the article's own 1.647 (28px).

		Upstream also hangs `maxWidth: layout.proseMaxWidth` (800px) on it through
		`xstyle`. That cap is **structurally inert on both sides** and is therefore
		not reproduced with a wrapper: `DocPageLayout`'s `Section maxWidth={800}
		padding={6}` already floors the column at 752px, so no paragraph can reach
		800px. Measured 752px on upstream and here at 1440.
	-->
	<Text as="p" display="block"><InlineMarkdown text={block.text} /></Text>
{:else if block.type === 'heading'}
	<!--
		A sub-heading inside a section, added upstream in 0.2.0. It is an anchor
		target *and* an outline entry at its own level — the second half landed with
		`build-outline.ts`, which mints `headingId` (deduped page-wide) and the
		matching `OutlineEntry`.

		`level` is defaulted exactly as upstream's renderer does. The data is
		authored, not validated, and a block that omits it must still render.
	-->
	<div id={headingId} class="block-heading">
		<Heading level={block.level ?? 3}>
			{block.text ?? ''}
			{#if headingId}
				<a class="anchor" href="#{headingId}" aria-label="Link to {block.text ?? ''}">#</a>
			{/if}
		</Heading>
	</div>
{:else if block.type === 'code'}
	<!--
		Upstream's `docs/CodeBlock.tsx`: a `VStack gap={1}` with the label as a
		supporting `Text` *above* the block rather than the block's own `title`,
		and `isWrapped` so long lines fold instead of scrolling.

		The width matters. `CodeBlock`'s default is `width="fit-content"`
		(upstream `CodeBlock.tsx:711`), which floors at `min(100%, 400px)` and
		otherwise shrinks to the longest line — correct for the component, and
		what left these blocks at 400–700px in a 752px column. Upstream's docsite
		overrides it with `xstyle={{width: '100%'}}`; `xstyle` needs StyleX, which
		a `.svelte` file may not import, so this uses the published `width` prop
		to reach the same box. The one difference is below a 400px container,
		where upstream's `fit-content` floor still forces an overflow and this
		does not — the docs column never gets that narrow.
	-->
	<VStack gap={1}>
		{#if block.label}
			<Text type="supporting" color="secondary">{block.label}</Text>
		{/if}
		<CodeBlock code={block.code} language={block.lang} width="100%" hasCopyButton isWrapped />
	</VStack>
{:else if block.type === 'table'}
	{#if previewType}
		<TokenTable headers={block.headers} rows={block.rows} {previewType} />
	{:else}
		<!--
			Upstream's `TableBlock`. This was a bare `<table>` on a note saying `Table`
			was unported; it has since landed, so the block is now upstream's own
			`Card` → `Table`, which brings the 16px card frame, spacious cells, row
			dividers, row hover and — the part that matters on a narrow viewport —
			`.astryx-table-scroll-wrapper`'s `overflow-x: auto`.
		-->
		<Card>
			<Table data={tableData} columns={tableColumns} density="spacious" dividers="rows" hasHover />
		</Card>
	{/if}
{:else if block.type === 'list'}
	<!--
		Upstream's `ListBlock`: `ordered` → `decimal`, `unordered` → `disc`,
		anything else (`do`, `dont`) → `none`. See the header note for why the
		do/dont badges are gone.
	-->
	<List
		density="compact"
		listStyle={block.style === 'ordered'
			? 'decimal'
			: block.style === 'unordered'
				? 'disc'
				: 'none'}
	>
		{#each block.items as item, i (i)}
			{#snippet itemLabel()}<InlineMarkdown text={item} />{/snippet}
			<ListItem label={itemLabel} />
		{/each}
	</List>
{:else if block.type === 'token-ref'}
	<!--
		Guarded on the type, not left as a bare `{:else}`. The catch-all read every
		*unhandled* block as a `token-ref` and dereferenced `block.section`, so
		0.2.0's new `heading` block did not degrade — it crashed the prerender with
		`Cannot read properties of undefined`. Upstream's switch ends in
		`default: return null`; the `{/if}` below is that, and the next block type
		upstream adds renders nothing instead of taking the site down.
	-->
	{#if referenced}
		{#each referenced.content as inner, i (i)}
			<Self block={inner} previewType={referenced.previewType} />
		{/each}
		<p class="prose">
			<Text type="supporting" color="secondary">
				Full reference: <a href={topicSectionHref(block.topic, sectionId(block.section))}
					>{block.section}</a
				>.
			</Text>
		</p>
	{:else}
		<p class="prose">
			<Text type="supporting" color="secondary">
				See <a href={topicSectionHref(block.topic, sectionId(block.section))}
					>{block.topic} → {block.section}</a
				>.
			</Text>
		</p>
	{/if}
{/if}

<style>
	/*
	 * A heading block is its own anchor target, so it needs the same
	 * scroll-margin the section wrapper carries — otherwise navigating to one from
	 * the outline lands it under the sticky header. Kept identical to
	 * `.doc-section`'s; both stand in for upstream's `AnchorHeading`.
	 */
	.block-heading {
		scroll-margin-block-start: calc(
			var(--_app-shell-header-height, 56px) + var(--docs-anchor-offset, 0px) + 16px
		);
	}

	.block-heading .anchor {
		margin-inline-start: var(--spacing-2);
		color: var(--color-text-disabled);
		text-decoration: none;
		opacity: 0;
	}

	.block-heading:hover .anchor,
	.block-heading .anchor:focus-visible {
		opacity: 1;
	}

	/*
	 * The `token-ref` footnote's own paragraph. Every other prose, list and table
	 * rule that used to live here is gone with the markup it styled — `Text`,
	 * `List` and `Table` carry those decisions now, which is where upstream keeps
	 * them.
	 */
	.prose {
		margin: 0;
	}
</style>
