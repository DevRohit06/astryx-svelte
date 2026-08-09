<script lang="ts">
	import { Button, Link, Markdown, Text } from '$lib/index.js';
	import type { MarkdownInlinePlugin, MarkdownSource } from '$lib/index.js';

	/**
	 * Upstream's `Markdown.stories.tsx` (11) and `MarkdownCitations.stories.tsx`
	 * (4), as a sibling route component — the `command-palette-demos.svelte`
	 * shape, because fifteen full markdown documents would otherwise bury the
	 * page.
	 *
	 * **All 15 stories.** Three translations recur:
	 *
	 * - The two streaming stories replace React's `key={key}` remount with a
	 *   Svelte `{#key}` block, which is the same mechanism under a different
	 *   spelling: bumping the key tears the subtree down so the incremental
	 *   parse state and the fade boundaries start clean.
	 * - `inlinePlugins[].render` is a `Snippet<[RegExpMatchArray, string]>` where
	 *   upstream has `(match, key) => ReactNode`. A template snippet does not
	 *   exist while the `<script>` runs, so the plugin array is `$derived.by` —
	 *   deferred to first read, which is inside the render. Same regexes, same
	 *   order, same links.
	 * - Storybook `args` stories become plain markup with the same props.
	 */

	const SAMPLE_MD = [
		'# Markdown Demo',
		'',
		'Renders **markdown** with *design-system-consistent* styling.',
		'',
		'## Features',
		'',
		'- Headings mapped to Astryx type scale',
		'- **Bold**, *italic*, and ~~strikethrough~~ text',
		'- [Links](https://example.com) with external detection',
		'- Inline `code` and fenced code blocks',
		'',
		'### Code Block',
		'',
		'```typescript',
		'interface User {',
		'  id: string;',
		'  name: string;',
		'}',
		'',
		'function greet(user: User) {',
		'  return `Hello, ${user.name}!`;',
		'}',
		'```',
		'',
		'### Blockquote',
		'',
		'> Design systems free teams to focus on problems that matter.',
		'',
		'### Table',
		'',
		'| Component | Status | Tests |',
		'|:----------|:------:|------:|',
		'| Markdown | Active | 73 |',
		'| CodeBlock | Active | 44 |',
		'',
		'### Task List',
		'',
		'- [x] Parser',
		'- [x] Renderer',
		'- [ ] Storybook stories',
		'',
		'---',
		'',
		'1. First ordered item',
		'2. Second ordered item'
	].join('\n');

	const STREAMING_RESPONSE = [
		'## Setting Up a Design System',
		'',
		"A design system is more than a component library — it's a **shared language** between design and engineering. Here's how to build one that scales.",
		'',
		'### 1. Start with Tokens',
		'',
		'Design tokens are the atomic values that define your visual language:',
		'',
		'```typescript',
		'const tokens = {',
		'  color: {',
		"    primary: '#0066FF',",
		"    secondary: '#6B7280',",
		"    success: '#10B981',",
		"    danger: '#EF4444',",
		'  },',
		'  spacing: {',
		"    xs: '4px',",
		"    sm: '8px',",
		"    md: '16px',",
		"    lg: '24px',",
		"    xl: '32px',",
		'  },',
		'  radius: {',
		"    sm: '4px',",
		"    md: '8px',",
		"    lg: '16px',",
		"    full: '9999px',",
		'  },',
		'};',
		'```',
		'',
		'These tokens should be the *single source of truth* for every component.',
		'',
		'### 2. Component Architecture',
		'',
		'Good components follow these principles:',
		'',
		'- **Composable** — small pieces that combine into complex UIs',
		'- **Accessible** — keyboard navigation and screen reader support built-in',
		'- **Themeable** — visual customization without forking',
		"- **Documented** — usage examples, props tables, and do/don't guidelines",
		'',
		'> The best design systems are *opinionated enough* to ensure consistency, but *flexible enough* to handle edge cases gracefully.',
		'',
		'### 3. Adoption Strategy',
		'',
		'Rolling out a design system requires planning:',
		'',
		'| Phase | Duration | Goal |',
		'|:------|:--------:|:-----|',
		'| Alpha | 4 weeks | Core components, internal dogfooding |',
		'| Beta | 8 weeks | Expanded component set, 2-3 pilot teams |',
		'| GA | Ongoing | Full adoption, migration support |',
		'',
		'Key metrics to track:',
		'',
		'1. **Component coverage** — what percentage of UI patterns are served',
		'2. **Adoption rate** — teams actively using the system',
		'3. **Contribution rate** — external PRs and feature requests',
		'4. **Consistency score** — visual audits across products',
		'',
		'### 4. Maintenance',
		'',
		'A design system is a *living product*. Plan for:',
		'',
		'- [x] Automated visual regression testing',
		'- [x] Semantic versioning with changelogs',
		'- [ ] Breaking change codemods',
		'- [ ] Cross-platform support (web, mobile, native)',
		'',
		'---',
		'',
		"The most important thing? **Ship early, iterate often.** A design system that exists and is used beats a perfect one that's still in planning."
	].join('\n');

	const CONTENT_ALIGN_TEXT = `
# Content Alignment

This paragraph is constrained by \`contentWidth\`. Notice how it's narrower than the code block and table below. The alignment prop controls where this narrow prose sits within the wider container.

Here's a bullet list that also respects prose width:
- First item with some explanation text
- Second item that wraps to show the width constraint
- Third item for good measure

\`\`\`typescript
// Code blocks break out to full container width regardless of contentAlign
export function calculateLayout(items: Item[], containerWidth: number): Layout {
  const columns = Math.floor(containerWidth / COLUMN_MIN_WIDTH);
  return { columns, gap: GRID_GAP, items: distributeItems(items, columns) };
}
\`\`\`

Back to prose — this paragraph is aligned according to the \`contentAlign\` prop while the code block above spans the full width.

| Component | Status | Notes |
|-----------|--------|-------|
| Button | Stable | Full API |
| CodeBlock | Stable | With collapsible |
| Markdown | In progress | Adding alignment |

Final paragraph after the table.
`;

	const IMAGES_MD = `
Here is some text before the image.

![A landscape photo](https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=680&h=400&fit=crop&auto=format)

Text between two images.

![A tall portrait photo](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop&auto=format)

And here's a really wide one:

![Wide panoramic shot](https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&h=300&fit=crop&auto=format)

Final paragraph after all images.
`;

	const PLUGIN_MD = [
		'## Release Notes — v2.1.0',
		'',
		'This release fixes several issues reported in PROJ-42 and introduces',
		'the inline plugins feature requested in #1873.',
		'',
		'### Bug Fixes',
		'',
		'- Fixed crash in streaming mode (BUG-789)',
		'- Resolved memory leak in chat components (PROJ-101)',
		'- **Bold context**: Plugin works inside **PROJ-55 formatting**',
		'',
		'### Code Example (not linkified)',
		'',
		'```typescript',
		'// PROJ-999 and BUG-888 should NOT become links inside code blocks',
		'const ticketId = "PROJ-999";',
		'```',
		'',
		'Inline code is also safe: `PROJ-999` stays as plain text.',
		'',
		'### Migration Guide',
		'',
		'See PROJ-200 for the full pattern. Also check [the docs](/docs/markdown)',
		'for usage alongside regular markdown links.'
	].join('\n');

	// The three one-line documents, hoisted rather than written inline: a
	// mustache holding a bare string literal is a lint error, and the last one
	// carries `\n` escapes a plain attribute cannot express.
	const INLINE_PROSE =
		'Use `value` with **controlled state** and [read the docs](https://example.com) without creating block wrappers.';

	const INLINE_PROP_DESCRIPTION =
		'Accepts an action item `{label, onClick?, icon?}`, a divider `{type: "divider"}`, or a section `{type: "section", items: [...]}`.';

	const NO_SOURCES_MD =
		'Text with [abc1] bracket markers but no sources prop.\n\nThey render as plain text.';

	const SEARCH_SOURCES: Record<string, MarkdownSource> = {
		abc1: {
			title: 'Tokyo - Wikipedia',
			url: 'https://en.wikipedia.org/wiki/Tokyo',
			icon: 'https://en.wikipedia.org/favicon.ico'
		},
		def2: {
			title: 'Japan Statistics Bureau - Population',
			url: 'https://www.stat.go.jp/english/'
		},
		ghi3: {
			title: 'World Population Review',
			url: 'https://worldpopulationreview.com/world-cities/tokyo-population'
		},
		jkl4: {
			title: 'Reuters — Tokyo GDP',
			url: 'https://www.reuters.com/markets/',
			icon: 'https://www.reuters.com/favicon.ico'
		},
		mno5: {
			title: 'UN Urbanization Prospects',
			url: 'https://population.un.org/wup/'
		}
	};

	const BRACKET_MD = [
		'## Tokyo Overview',
		'',
		'Tokyo is the capital of Japan with a population of over 14 million[abc1].',
		"It's the most populous metropolitan area in the world[def2][ghi3].",
		'',
		'### Economy',
		'',
		"Tokyo's GDP exceeds $1.9 trillion, making it the largest city economy globally[jkl4].",
		'The metropolitan area is expected to remain the most populous urban agglomeration through 2035[mno5].',
		'',
		'### Key Facts',
		'',
		'- Population: 13.96 million (city proper)[abc1]',
		'- Metro area: 37.4 million[def2]',
		'- GDP: $1.93 trillion[jkl4]',
		'',
		'For more details, see the [full Wikipedia article](https://en.wikipedia.org/wiki/Tokyo).'
	].join('\n');

	const FULLWIDTH_MD = [
		'## Search Results',
		'',
		'Tokyo has a population of over 14 million【abc1】.',
		'The greater Tokyo area houses 37 million people【def2】【ghi3】.',
		'',
		"The city's economy is the largest in the world【jkl4】,",
		'and urbanization trends suggest continued growth【mno5】.'
	].join('\n');

	const STREAMING_CITATION_MD = [
		'## AI Research Summary',
		'',
		'Large language models have shown remarkable capabilities in recent years[abc1].',
		'Scaling laws suggest continued improvement with more compute[def2].',
		'',
		'### Key Findings',
		'',
		'- Models above 100B parameters show emergent abilities[ghi3]',
		'- Fine-tuning remains critical for task-specific performance[jkl4]',
		'- Safety alignment is an active area of research[mno5]',
		'',
		'These results have broad implications for the field.'
	].join('\n');

	// --- Streaming story state (shared shape, one instance each) ---

	function createStreamer(text: string) {
		let charIndex = $state(0);
		let isStreaming = $state(true);
		let runKey = $state(0);
		let timer: ReturnType<typeof setTimeout> | undefined;

		$effect(() => {
			if (!isStreaming) return;
			if (charIndex >= text.length) {
				isStreaming = false;
				return;
			}
			const chunkSize = Math.floor(Math.random() * 8) + 2;
			const delay = 30 + Math.random() * 60;
			timer = setTimeout(() => {
				charIndex = Math.min(charIndex + chunkSize, text.length);
			}, delay);
			return () => clearTimeout(timer);
		});

		return {
			get charIndex() {
				return charIndex;
			},
			get isStreaming() {
				return isStreaming;
			},
			get runKey() {
				return runKey;
			},
			get slice() {
				return text.slice(0, charIndex);
			},
			total: text.length,
			replay() {
				charIndex = 0;
				isStreaming = true;
				runKey += 1;
			}
		};
	}

	const responseStream = createStreamer(STREAMING_RESPONSE);
	const citationStream = createStreamer(STREAMING_CITATION_MD);

	const inlinePlugins = $derived.by<MarkdownInlinePlugin[]>(() => [
		{
			// JIRA-style ticket references: PROJ-123, BUG-456, etc.
			pattern: /\b([A-Z][A-Z0-9]+-\d+)\b/g,
			render: jiraLink
		},
		{
			// GitHub-style issue references: #123, #456, etc.
			pattern: /#(\d+)/g,
			render: issueLink
		}
	]);
</script>

{#snippet jiraLink(match: RegExpMatchArray)}
	<Link href={`https://issues.example.com/browse/${match[1]}`} isExternalLink weight="semibold">
		{match[0]}
	</Link>
{/snippet}

{#snippet issueLink(match: RegExpMatchArray)}
	<Link href={`https://github.com/org/repo/issues/${match[1]}`} isExternalLink weight="semibold">
		{match[0]}
	</Link>
{/snippet}

<h3>Default</h3>
<Markdown children={SAMPLE_MD} />

<h3>Compact</h3>
<Markdown density="compact" children={SAMPLE_MD} />

<h3>AI Response</h3>
<Markdown density="compact" headingLevelStart={3} children={STREAMING_RESPONSE} />

<h3>Shifted Headings (start at h3)</h3>
<Markdown headingLevelStart={3} children={SAMPLE_MD} />

<h3>Inline Display</h3>
<div style="max-width: 680px; display: grid; gap: 16px">
	<Text type="large" display="block">
		<Markdown display="inline" children={INLINE_PROSE} />
	</Text>

	<div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; display: grid; gap: 6px">
		<Text type="body" weight="bold" display="block">Prop description</Text>
		<Text type="body" color="secondary" display="block">
			<Markdown display="inline" children={INLINE_PROP_DESCRIPTION} />
		</Text>
	</div>
</div>

<h3>Table</h3>
<Markdown
	children={[
		'## Comparison Table',
		'',
		'| Feature | React | Vue | Svelte |',
		'|:--------|:-----:|:---:|-------:|',
		'| Virtual DOM | Yes | Yes | No |',
		'| Bundle Size | ~40KB | ~30KB | ~2KB |',
		'| TypeScript | Native | Plugin | Native |',
		'| Learning Curve | Medium | Easy | Easy |'
	].join('\n')}
/>

<h3>Streaming</h3>
<div>
	<div style="margin-block-end: 12px; display: flex; gap: 8px; align-items: center">
		<Button
			label="Replay"
			variant="secondary"
			size="sm"
			onclick={() => responseStream.replay()}
			isDisabled={responseStream.isStreaming}
		/>
		<span style="font-size: 12px; color: #666">
			{responseStream.isStreaming
				? `Streaming... ${responseStream.charIndex}/${responseStream.total}`
				: 'Complete'}
		</span>
	</div>
	{#key responseStream.runKey}
		<Markdown
			isStreaming={responseStream.isStreaming}
			density="compact"
			headingLevelStart={3}
			children={responseStream.slice}
		/>
	{/key}
</div>

<h3>With Images</h3>
<div style="max-width: 800px">
	<Markdown children={IMAGES_MD} />
</div>

<h3>Content Align: Start</h3>
<div style="max-width: 900px; border: 1px dashed #ccc; padding: 16px">
	<Markdown contentWidth={580} contentAlign="start" children={CONTENT_ALIGN_TEXT} />
</div>

<h3>Content Align: Center</h3>
<div style="max-width: 900px; border: 1px dashed #ccc; padding: 16px">
	<Markdown contentWidth={580} contentAlign="center" children={CONTENT_ALIGN_TEXT} />
</div>

<h3>Inline Plugins</h3>
<div style="max-width: 680px">
	<Markdown {inlinePlugins} density="compact" headingLevelStart={2} children={PLUGIN_MD} />
</div>

<h3>Citations — Bracket [id]</h3>
<Markdown sources={SEARCH_SOURCES} density="compact" headingLevelStart={3} children={BRACKET_MD} />

<h3>Citations — Fullwidth 【id】</h3>
<Markdown
	sources={SEARCH_SOURCES}
	density="compact"
	headingLevelStart={3}
	children={FULLWIDTH_MD}
/>

<h3>Citations — No Sources (passthrough)</h3>
<Markdown children={NO_SOURCES_MD} />

<h3>Citations — Streaming</h3>
<div>
	<div style="margin-block-end: 12px; display: flex; gap: 8px; align-items: center">
		<Button
			label="Replay"
			variant="secondary"
			size="sm"
			onclick={() => citationStream.replay()}
			isDisabled={citationStream.isStreaming}
		/>
		<span style="font-size: 12px; color: #666">
			{citationStream.isStreaming
				? `Streaming... ${citationStream.charIndex}/${citationStream.total}`
				: 'Complete'}
		</span>
	</div>
	{#key citationStream.runKey}
		<Markdown
			isStreaming={citationStream.isStreaming}
			density="compact"
			headingLevelStart={3}
			sources={SEARCH_SOURCES}
			children={citationStream.slice}
		/>
	{/key}
</div>
