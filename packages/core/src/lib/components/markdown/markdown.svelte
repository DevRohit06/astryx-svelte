<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	// Upstream imports `TextDisplay` from `theme/types`; this port declares it
	// with the rest of `Text`'s style vocabulary, which is where its other
	// consumers (`Text`, `Heading`, `Link`) already take it from.
	import type { TextDisplay } from '../text/text.stylex.js';
	import type {
		MarkdownComponents,
		MarkdownInlinePlugin,
		MarkdownSource
	} from './markdown-types.js';

	export interface MarkdownProps extends BaseProps<HTMLElement> {
		children: string;
		/**
		 * Display type. Markdown defaults to block.
		 * Use 'inline' for markdown spans embedded inside surrounding text.
		 * @default 'block'
		 */
		display?: TextDisplay;
		density?: 'default' | 'compact';
		/**
		 * The HTML heading level that markdown `#` maps to.
		 * Shifts all heading levels down to fit the surrounding page hierarchy.
		 * E.g. headingLevelStart={3} renders `#` as h3, `##` as h4, `###` as h5.
		 * Levels that would exceed h6 are clamped to h6.
		 * @default 1
		 */
		headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6;
		isStreaming?: boolean;
		onLinkClick?: (href: string, event: MouseEvent) => void | false;
		/**
		 * Citation sources keyed by ID. When provided, `[id]` and `【id】` markers
		 * in the markdown that match a key are rendered as citation chips.
		 */
		sources?: Record<string, MarkdownSource>;
		/**
		 * How citations are displayed inline.
		 * - `'label'` (default) — chip with source title text, icon, and border
		 * - `'number'` — compact numbered badge (1, 2, 3…)
		 * @default 'label'
		 */
		citationStyle?: 'label' | 'number';
		/**
		 * Max width for prose content (paragraphs, headings, lists, blockquotes).
		 * Tables and code blocks are unconstrained and can expand to the full
		 * container width. Use for readable line lengths in wide layouts.
		 *
		 * @example
		 * ```svelte
		 * <Markdown contentWidth={640}>{text}</Markdown>
		 * ```
		 */
		contentWidth?: number | string;
		/**
		 * Alignment of prose content within the container when `contentWidth`
		 * is narrower than the available space.
		 * - 'start': left-aligned (default)
		 * - 'center': centered
		 * @default 'start'
		 */
		contentAlign?: 'start' | 'center';
		components?: Partial<MarkdownComponents>;
		/**
		 * Plugins that transform text patterns into custom elements.
		 * Applied to text nodes after parsing — code blocks and inline code
		 * are unaffected. Patterns are matched in order; first match wins
		 * for overlapping ranges.
		 */
		inlinePlugins?: MarkdownInlinePlugin[];
		/**
		 * Opt-in autolinking of bare URLs and emails inside text.
		 * - `'gfm'` — GitHub-Flavored Markdown autolink-literal rules:
		 *   `https?://…`, `www.…`, `<scheme:url>`, `<email>`, and bare
		 *   `user@host` all become `<a>` links. Trailing sentence punctuation
		 *   (`?!.,:*_~`) and unbalanced trailing `)` are excluded; matches inside
		 *   code spans, code blocks, existing links, and image alt text are
		 *   skipped.
		 *
		 * Default behavior (option unset) is unchanged — bare URLs render as
		 * literal text.
		 */
		autolink?: 'gfm';
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import Blockquote from '../blockquote/blockquote.svelte';
	import CheckboxList from '../checkbox-list/checkbox-list.svelte';
	import CheckboxListItem from '../checkbox-list/checkbox-list-item.svelte';
	import Citation from '../citation/citation.svelte';
	import Code from '../code/code.svelte';
	import CodeBlock from '../code-block/code-block.svelte';
	import LinkElement from '../link/link-element.svelte';
	import List from '../list/list.svelte';
	import ListItem from '../list/list-item.svelte';
	import Table from '../table/table.svelte';
	import TableBody from '../table/table-body.svelte';
	import TableCell from '../table/table-cell.svelte';
	import TableHeader from '../table/table-header.svelte';
	import TableHeaderCell from '../table/table-header-cell.svelte';
	import TableRow from '../table/table-row.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import { useStreamingText } from '../../hooks/use-streaming-text.svelte.js';
	import { useTheme } from '../../theme/use-theme.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		createIncrementalState,
		parseInline,
		parseMarkdown,
		parseMarkdownIncremental,
		trimStreamingArtifacts,
		type BlockNode,
		type InlineNode
	} from './parser.js';
	import { computeBoundaries, computeSegments } from './streaming.js';
	import {
		buildRenderPlan,
		computeTableColumnMinWidths,
		countBlockTextLength,
		countInlineTextLength,
		parseDuration,
		sanitizeUrl,
		type TextRenderSegment
	} from './markdown-render-plan.js';
	import {
		markdownBlockIndentXstyle,
		markdownBlockquoteXstyle,
		markdownBoldAttrs,
		markdownCellXstyle,
		markdownCodeBlockWrapperAttrs,
		markdownCodeBlockXstyle,
		markdownFadeInAttrs,
		markdownHeadingAttrs,
		markdownHrAttrs,
		markdownImageAttrs,
		markdownImageBlockAttrs,
		markdownLinkAttrs,
		markdownListWrapperAttrs,
		markdownParagraphAttrs,
		markdownRootAttrs,
		markdownStrikethroughAttrs,
		markdownTableWrapperAttrs,
		markdownTaskListWrapperAttrs,
		type BlockStyleContext
	} from './markdown.stylex.js';

	/**
	 * Renders a markdown string as Astryx components. Supports streaming with
	 * smooth fade-in animation via `isStreaming`.
	 *
	 * Two structural notes, both recorded at length where they live:
	 *
	 * - **The cursor and the citation numbering are precomputed**, not mutated
	 *   during the render — see `markdown-render-plan.ts`. Upstream can thread a
	 *   mutable cursor through `renderInline`/`renderBlock` because React renders
	 *   in one synchronous pass; Svelte's snippets are evaluated lazily and
	 *   independently, so the walk runs once up front and the template reads it.
	 * - **`renderInline` / `renderBlock` are self-referencing snippets**, the
	 *   `TreeList` precedent, rather than functions returning nodes.
	 *
	 * @example
	 * ```svelte
	 * <Markdown>
	 *   {'# Hello\n\nThis is **bold** and _italic_ text.\n\n- Item one\n- Item two'}
	 * </Markdown>
	 * ```
	 */
	let {
		children,
		display = 'block',
		density = 'default',
		headingLevelStart = 1,
		isStreaming = false,
		onLinkClick,
		sources,
		citationStyle = 'label',
		contentWidth = 680,
		contentAlign = 'start',
		components,
		inlinePlugins,
		autolink,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: MarkdownProps = $props();

	const t = useTranslator();
	const resolveLinkComponent = useLinkComponent();
	const linkComponent = $derived(resolveLinkComponent().component);

	// Derive the set of source IDs for the parser.
	const sourceIds = $derived(sources ? new Set(Object.keys(sources)) : undefined);
	const parseOptions = $derived({ sourceIds, autolink });

	// Smooth bursty streamed chunks into a steady character-by-character reveal.
	// When not streaming, the hook returns children unchanged (no-op).
	const smoothed = useStreamingText(
		() => children,
		() => isStreaming
	);

	// Upstream keeps the incremental cache in a ref and resets it when `autolink`
	// flips, comparing against a second ref during the render. `$derived.by` over
	// `autolink` gives a fresh state for each setting with no comparison at all —
	// the cache is scoped to the option it was built with.
	const incrementalState = $derived.by(() => {
		void autolink;
		return createIncrementalState();
	});

	const blocks = $derived.by((): BlockNode[] => {
		if (display === 'inline') {
			return [];
		}
		if (isStreaming) {
			if (smoothed.current === '') {
				// Upstream replaces the whole ref here (`incrementalStateRef.current =
				// createIncrementalState()`) before returning. A `$derived` cannot be
				// reassigned, so the reset is written in place — same six fields, same
				// effect: a new message starts with no settled text or blocks carried
				// over from the last one.
				Object.assign(incrementalState, createIncrementalState(), {
					autolink: undefined,
					linkDefsKey: undefined
				});
				return [];
			}
			const input = trimStreamingArtifacts(smoothed.current);
			return parseMarkdownIncremental(input, incrementalState, parseOptions);
		}
		return parseMarkdown(children, parseOptions);
	});

	const inlineNodes = $derived.by((): InlineNode[] => {
		if (display !== 'inline') {
			return [];
		}
		const input = isStreaming ? trimStreamingArtifacts(smoothed.current) : children;
		return parseInline(input, parseOptions);
	});

	// Track recent boundaries for stacked fade-in animation.
	// The number of spans needed = ceil(animationDuration / tickInterval).
	// useStreamingText ticks every ~tickMs, and the fade runs for
	// --duration-fast-max. We compute the span count dynamically so the
	// oldest span has just finished animating when it gets evicted.
	const { token } = useTheme();
	const maxSpans = $derived.by(() => {
		const duration = parseDuration(token('--duration-fast-max')) ?? 230;
		const tick = parseDuration(token('--duration-fast-min'));
		// Tick interval mirrors useStreamingText's timing: base / 10
		const tickMs = tick != null ? Math.max(4, Math.round(tick / 10)) : 50;
		return Math.min(Math.ceil(duration / tickMs), 12);
	});

	// Upstream's `prevBlocksRef` / `prevInlineNodesRef` / `boundariesRef` trio.
	// Plain `let`s, not `$state`: nothing reads them reactively, and the derived
	// below must not re-run when they change — it is what changes them.
	let prevRenderedLen = 0;
	let boundariesRef: number[] = [];

	// `smoothedLen` is its own `$derived` rather than an inline
	// `smoothed.current.length` read, and the indirection is the whole point:
	// upstream's dependency list is `[display, smoothedLen, maxSpans]` — the
	// *length*, not the text. Reading `.length` inline would make `boundaries`
	// depend on everything `smoothed.current` does (`children`, `isStreaming`,
	// `displayedLen`, the reduced-motion query, `speed`), so a chunk that did not
	// change the length would still push a zero-width entry into the ring buffer
	// and evict a live fade span one tick early. A derived that recomputes to an
	// equal number does not invalidate its readers, which is exactly the
	// dependency upstream declares.
	const smoothedLen = $derived(smoothed.current.length);

	const boundaries = $derived.by(() => {
		// Dependency list, upstream's: [display, smoothedLen, maxSpans].
		void display;
		void smoothedLen;
		const next = computeBoundaries(boundariesRef, prevRenderedLen, maxSpans);
		boundariesRef = next;
		return next;
	});

	// Upstream writes `prevBlocksRef.current = blocks` at the end of the render
	// body; a post-render effect is the same point in the cycle.
	$effect(() => {
		prevRenderedLen =
			display === 'inline' ? countInlineTextLength(inlineNodes) : countBlockTextLength(blocks);
	});

	const plan = $derived(buildRenderPlan(blocks, inlineNodes, inlinePlugins, sources));

	const contentWidthValue = $derived(
		contentWidth ? (typeof contentWidth === 'number' ? `${contentWidth}px` : contentWidth) : null
	);

	const theme = $derived(themeProps('markdown', { density }));

	/**
	 * The per-block theme targets. Every block type renders a stable
	 * `astryx-markdown-<block>` class reflecting `data-density`, so a theme can
	 * tune the gap around that block (`marginBlockStart`/`marginBlockEnd`) with
	 * `defineTheme` instead of a fragile `[role="paragraph"]` descendant
	 * selector. Only the *default* render path carries one — a supplied
	 * `components.heading`/`code`/`blockquote`/`hr`/`image` owns its own styling,
	 * as upstream's early returns do.
	 *
	 * All but the heading depend on `density` alone, so they are hoisted here
	 * rather than rebuilt per block; the heading target additionally reflects
	 * `data-level`, so it is built inside the block snippet.
	 */
	const paragraphTheme = $derived(themeProps('markdown-paragraph', { density }));
	const listTheme = $derived(themeProps('markdown-list', { density }));
	const codeblockTheme = $derived(themeProps('markdown-codeblock', { density }));
	const blockquoteTheme = $derived(themeProps('markdown-blockquote', { density }));
	const tableTheme = $derived(themeProps('markdown-table', { density }));
	const hrTheme = $derived(themeProps('markdown-hr', { density }));
	const imageTheme = $derived(themeProps('markdown-image', { density }));

	const rootAttrs = $derived(markdownRootAttrs(display === 'inline', xstyle));
	const boldAttrs = markdownBoldAttrs();
	const strikeAttrs = markdownStrikethroughAttrs();
	const linkAttrs = markdownLinkAttrs();
	const imageAttrs = markdownImageAttrs();
	const fadeAttrs = markdownFadeInAttrs();

	function blockCtx(node: BlockNode, index: number, blockCount: number): BlockStyleContext {
		return {
			node,
			density,
			contentWidthValue,
			contentAlign,
			isFirst: index === 0,
			isLast: index === blockCount - 1
		};
	}

	function isExternalHref(href: string): boolean {
		return href.startsWith('https://') || href.startsWith('http://');
	}

	function linkProps(href: string): Record<string, unknown> {
		const external = isExternalHref(href);
		return {
			href,
			onclick: onLinkClick
				? (event: MouseEvent) => {
						const result = onLinkClick(href, event);
						if (result === false) {
							event.preventDefault();
						}
					}
				: undefined,
			...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
			class: linkAttrs.class,
			style: linkAttrs.style
		};
	}
</script>

{#snippet fadedText(seg: Extract<TextRenderSegment, { kind: 'text' }>)}
	{#if !isStreaming}
		{seg.content}
	{:else}
		{@const parts = computeSegments(seg.content, seg.offset, boundaries, seg.fadeKey)}
		{#if parts == null}
			{seg.content}
		{:else}
			<span>
				{#each parts as part (part.key)}
					{#if part.fading}
						<span class={fadeAttrs.class} style={fadeAttrs.style}>{part.text}</span>
					{:else}
						<span>{part.text}</span>
					{/if}
				{/each}
			</span>
		{/if}
	{/if}
{/snippet}

{#snippet inlineNode(node: InlineNode)}
	{#if node.type === 'text'}
		{#each plan.text.get(node) ?? [] as seg (seg.key)}
			{#if seg.kind === 'text'}
				{@render fadedText(seg)}
			{:else}
				{@render seg.plugin.render(seg.match, seg.renderKey)}
			{/if}
		{/each}
	{:else if node.type === 'bold'}
		<strong class={boldAttrs.class} style={boldAttrs.style}>
			{@render inlineFragment(node.children)}
		</strong>
	{:else if node.type === 'italic'}
		<em>{@render inlineFragment(node.children)}</em>
	{:else if node.type === 'strikethrough'}
		<del class={strikeAttrs.class} style={strikeAttrs.style}>
			{@render inlineFragment(node.children)}
		</del>
	{:else if node.type === 'code'}
		{#if components?.inlineCode}
			{@const InlineCodeComp = components.inlineCode}
			<InlineCodeComp children={node.content} />
		{:else}
			<Code>{node.content}</Code>
		{/if}
	{:else if node.type === 'link'}
		{@const safeHref = sanitizeUrl(node.href)}
		{#if safeHref == null}
			<!-- Unsafe URL — render as plain text -->
			<span>{@render inlineFragment(node.children)}</span>
		{:else if components?.link}
			{@const LinkComp = components.link}
			<LinkComp href={safeHref}>{@render inlineFragment(node.children)}</LinkComp>
		{:else}
			<!--
				Use linkComponent for internal links, native <a> for external links.
				Framework routers handle internal navigation; external links with
				target="_blank" should use a plain anchor.
			-->
			<LinkElement
				component={isExternalHref(safeHref) ? 'a' : linkComponent}
				props={linkProps(safeHref)}
			>
				{@render inlineFragment(node.children)}
			</LinkElement>
		{/if}
	{:else if node.type === 'image'}
		{@const safeSrc = sanitizeUrl(node.src)}
		{#if safeSrc == null}
			<span>[{node.alt}]</span>
		{:else if components?.image}
			{@const ImageComp = components.image}
			<ImageComp src={safeSrc} alt={node.alt} />
		{:else}
			<img src={safeSrc} alt={node.alt} class={imageAttrs.class} style={imageAttrs.style} />
		{/if}
	{:else if node.type === 'break'}
		<br />
	{:else if node.type === 'citation'}
		{#if !sources}
			<!-- No sources provided — render as plain text -->
			<span>[{node.sourceId}]</span>
		{:else}
			{@const num = plan.citationNumber.get(node) ?? 1}
			{@const source = sources[node.sourceId] ?? { title: node.sourceId }}
			{@const citVariant = citationStyle === 'number' ? 'number' : 'label'}
			{#if components?.citation}
				{@const CitationComp = components.citation}
				<CitationComp {source} number={num} variant={citVariant} />
			{:else}
				<Citation {source} number={num} variant={citVariant} />
			{/if}
		{/if}
	{/if}
{/snippet}

{#snippet inlineFragment(nodes: InlineNode[])}
	{#each nodes as node, i (i)}
		{@render inlineNode(node)}
	{/each}
{/snippet}

{#snippet listItemLabel(itemChildren: BlockNode[])}
	{@const firstChild = itemChildren[0]}
	{#if itemChildren.length === 1 && firstChild?.type === 'paragraph'}
		{@render inlineFragment(firstChild.children)}
	{:else}
		{@render blocksFragment(itemChildren, itemChildren.length)}
	{/if}
{/snippet}

{#snippet blockNode(node: BlockNode, index: number, blockCount: number)}
	{@const ctx = blockCtx(node, index, blockCount)}
	{#if node.type === 'heading'}
		{@const level = Math.min(node.level + headingLevelStart - 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}
		{#if components?.heading}
			{@const HeadingComp = components.heading}
			<HeadingComp {level}>{@render inlineFragment(node.children)}</HeadingComp>
		{:else}
			{@const attrs = markdownHeadingAttrs(ctx, level)}
			{@const headingTheme = themeProps('markdown-heading', { density, level })}
			<svelte:element
				this={`h${level}`}
				{...headingTheme}
				class={cx(headingTheme.class, attrs.class)}
				style={attrs.style}
			>
				{@render inlineFragment(node.children)}
			</svelte:element>
		{/if}
	{:else if node.type === 'paragraph'}
		{#if components?.paragraph}
			{@const ParagraphComp = components.paragraph}
			<ParagraphComp>{@render inlineFragment(node.children)}</ParagraphComp>
		{:else}
			{@const attrs = markdownParagraphAttrs(ctx)}
			<!--
				Markdown paragraphs render as <div>, not <p>: inline content can
				include block-level nodes (images, custom inline components), and a
				<p> would reparent them, desyncing SSR markup from the hydrated DOM.
				Block spacing comes from token-based StyleX margins, so the rendered
				appearance is unchanged. role="paragraph" re-exposes the paragraph
				role in the accessibility tree (a pure ARIA hint — it does not trigger
				the parser's block-child reparenting) so prose semantics are preserved
				without the <p> composition hazard. Consumers who want a real <p>
				element can still pass a `paragraph` component override.
			-->
			<div
				role="paragraph"
				{...paragraphTheme}
				class={cx(paragraphTheme.class, attrs.class)}
				style={attrs.style}
			>
				{@render inlineFragment(node.children)}
			</div>
		{/if}
	{:else if node.type === 'codeblock'}
		{#if components?.code}
			{@const CodeBlockComp = components.code}
			<CodeBlockComp code={node.content} language={node.language} />
		{:else}
			{@const attrs = markdownCodeBlockWrapperAttrs(ctx)}
			<div {...codeblockTheme} class={cx(codeblockTheme.class, attrs.class)} style={attrs.style}>
				<CodeBlock
					code={node.content}
					language={node.language}
					isCollapsible
					xstyle={markdownCodeBlockXstyle(ctx)}
				/>
			</div>
		{/if}
	{:else if node.type === 'blockquote'}
		{#if components?.blockquote}
			{@const BlockquoteComp = components.blockquote}
			<BlockquoteComp>
				{@render blocksFragment(node.children, node.children.length)}
			</BlockquoteComp>
		{:else}
			<!--
				Upstream spreads the target onto `Blockquote` rather than onto a
				wrapper, so the element carries both `astryx-blockquote` and
				`astryx-markdown-blockquote`. `class` lands on `Blockquote`'s own
				`class` prop and merges; `data-density` rides its rest props.
			-->
			<Blockquote {...blockquoteTheme} xstyle={markdownBlockquoteXstyle(ctx)}>
				{@render blocksFragment(node.children, node.children.length)}
			</Blockquote>
		{/if}
	{:else if node.type === 'list'}
		{@const isTaskList = node.items.length > 0 && node.items.every((item) => item.checked != null)}
		{#if isTaskList}
			{@const checkedValues = node.items
				.map((item, i) => ({ item, key: `task-${i}` }))
				.filter(({ item }) => item.checked)
				.map(({ key }) => key)}
			{@const attrs = markdownTaskListWrapperAttrs(ctx)}
			<div {...listTheme} class={cx(listTheme.class, attrs.class)} style={attrs.style}>
				<CheckboxList
					label={t('@astryx.markdown.taskList')}
					isLabelHidden
					value={checkedValues}
					xstyle={markdownBlockIndentXstyle}
					isReadOnly
					density="compact"
				>
					{#each node.items as item, i (i)}
						{#snippet taskLabel()}
							{@render listItemLabel(item.children)}
						{/snippet}
						<CheckboxListItem value={`task-${i}`} label={taskLabel} />
					{/each}
				</CheckboxList>
			</div>
		{:else}
			{@const attrs = markdownListWrapperAttrs(ctx)}
			<div {...listTheme} class={cx(listTheme.class, attrs.class)} style={attrs.style}>
				<List
					listStyle={node.ordered ? 'decimal' : 'disc'}
					density="compact"
					start={node.ordered ? node.start : undefined}
					xstyle={markdownBlockIndentXstyle}
				>
					{#each node.items as item, i (i)}
						{#snippet itemLabel()}
							{@render listItemLabel(item.children)}
						{/snippet}
						<ListItem label={itemLabel} />
					{/each}
				</List>
			</div>
		{/if}
	{:else if node.type === 'table'}
		{@const colMinWidths = computeTableColumnMinWidths(node)}
		{@const attrs = markdownTableWrapperAttrs(ctx)}
		<!--
			Keyboard-focusable so keyboard users can scroll a horizontally
			overflowing GFM table. Uses role="group" (not "region") so multiple
			tables don't create duplicate same-named landmarks (axe: landmark-unique).
		-->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			tabindex="0"
			role="group"
			aria-label={t('@astryx.markdown.table')}
			{...tableTheme}
			class={cx(tableTheme.class, attrs.class)}
			style={attrs.style}
		>
			<Table dividers="rows" textOverflow="wrap">
				<TableHeader>
					<TableRow>
						{#each node.headers as header, i (i)}
							<TableHeaderCell xstyle={markdownCellXstyle(colMinWidths[i], node.alignments[i])}>
								{@render inlineFragment(header.children)}
							</TableHeaderCell>
						{/each}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each node.rows as row, i (i)}
						<TableRow>
							{#each row as cell, j (j)}
								<TableCell xstyle={markdownCellXstyle(null, node.alignments[j])}>
									{@render inlineFragment(cell.children)}
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{:else if node.type === 'hr'}
		{#if components?.hr}
			{@const HrComp = components.hr}
			<HrComp />
		{:else}
			{@const attrs = markdownHrAttrs(ctx)}
			<hr {...hrTheme} class={cx(hrTheme.class, attrs.class)} style={attrs.style} />
		{/if}
	{:else if node.type === 'image'}
		{@const safeSrc = sanitizeUrl(node.src)}
		{@const attrs = markdownImageBlockAttrs(ctx)}
		{#if safeSrc == null}
			<div {...imageTheme} class={cx(imageTheme.class, attrs.class)} style={attrs.style}>
				[{node.alt}]
			</div>
		{:else if components?.image}
			<!--
				A standalone `![alt](src)` line parses as a *block* image, and this
				branch used to hardcode a bare `<img>` and ignore a supplied
				`components.image`. It now honours the override just as the inline
				image path does — note the override replaces the wrapper too, as
				upstream's early `return` does.
			-->
			{@const ImageComp = components.image}
			<ImageComp src={safeSrc} alt={node.alt} />
		{:else}
			<div {...imageTheme} class={cx(imageTheme.class, attrs.class)} style={attrs.style}>
				<img src={safeSrc} alt={node.alt} class={imageAttrs.class} style={imageAttrs.style} />
			</div>
		{/if}
	{/if}
{/snippet}

{#snippet blocksFragment(nodes: BlockNode[], blockCount: number)}
	{#each nodes as node, i (i)}
		{@render blockNode(node, i, blockCount)}
	{/each}
{/snippet}

{#if display === 'inline'}
	<span
		{...rest}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{@render inlineFragment(inlineNodes)}
	</span>
{:else}
	<!--
		`{...rest}` is spread **before** `role`, which is the ordering every other
		closed-prop-list root in this port uses (`List`'s note says it explicitly):
		upstream declares `BaseProps<HTMLElement>` and then destructures a closed
		list with no rest spread at all, so its `role` is unconditionally
		`document`. Forwarding rest is this port's settled answer to that
		contradiction, but forwarding it *after* `role` would let a caller replace
		a semantic the component owns — the `Dialog` role-clobber shape.
	-->
	<div
		{...rest}
		role="document"
		data-testid={testId}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{@render blocksFragment(blocks, blocks.length)}
	</div>
{/if}
