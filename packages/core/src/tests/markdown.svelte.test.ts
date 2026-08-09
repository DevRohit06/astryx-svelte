import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Markdown from '$lib/components/markdown/markdown.svelte';
import MarkdownCustomHeading from './fixtures/markdown-custom-heading.svelte';
import MarkdownCustomImage from './fixtures/markdown-custom-image.svelte';
import MarkdownInlinePlugins from './fixtures/markdown-inline-plugins.svelte';
import type { MarkdownPluginSpec } from './fixtures/markdown-inline-plugins.svelte';

/**
 * Astryx's `Markdown/Markdown.test.tsx` (62 cases at 0.3.0), ported case for
 * case. Nothing is dropped; every upstream `it` has a counterpart here, in
 * upstream's order and under upstream's name.
 *
 * Five things read differently, each commented where it appears:
 *
 * - **`children` is the markdown string prop**, as upstream, so it arrives as
 *   `props: {children: '…'}` rather than as JSX children. Passing it as Svelte
 *   component content would make it a snippet.
 * - **`forwards ref`** becomes the attachment counterpart. Svelte has no `ref`;
 *   a consumer reaches the root through an attachment in the rest props, which
 *   `Markdown` spreads onto its root `<div>`. It checks more than upstream's,
 *   receiving the element rather than only proving a ref landed.
 * - **upstream's DOM-wide `document.querySelector`** is scoped to the render
 *   container. The precedent is `file-input` / `lightbox`; it is strictly
 *   narrower, so nothing an assertion could catch is lost.
 * - **`fireEvent.click`** on a link becomes a dispatched cancelable
 *   `MouseEvent` plus a capture-phase `preventDefault`. Upstream's handler
 *   returns `undefined`, so nothing cancels the anchor's default action, and a
 *   real Playwright click in a real browser would navigate the test page away.
 *   The dispatched event is what `fireEvent.click` sends.
 * - **`components.*` overrides are fixture component files**, not inline
 *   arrow components: `MarkdownComponents` types each entry as a Svelte
 *   `Component<…>`, and a Svelte component cannot be declared inside a `.ts`
 *   test. `markdown-custom-image.svelte` and `markdown-custom-heading.svelte`
 *   are upstream's two inline overrides, verbatim.
 *
 * The `inlinePlugins` cases go through `markdown-inline-plugins.svelte`:
 * `MarkdownInlinePlugin.render` is a `Snippet<[RegExpMatchArray, string]>` where
 * upstream has `(match, key) => ReactNode`, and a snippet can only be authored
 * in a template.
 *
 * Runs in the **client** (real Chromium) project: it is a DOM suite throughout,
 * and the table, task-list and code-block cases render the real `Table`,
 * `CheckboxList` and `CodeBlock` families.
 */

describe('Markdown', () => {
	it('renders with role="document"', async () => {
		const screen = await render(Markdown, { props: { children: 'Hello' } });
		await expect.element(screen.getByRole('document')).toBeInTheDocument();
	});

	it('renders astryx-markdown class name', async () => {
		const screen = await render(Markdown, { props: { children: 'Hello' } });
		expect(screen.container.firstElementChild!.className).toContain('astryx-markdown');
	});

	it('renders headings', async () => {
		const screen = await render(Markdown, { props: { children: '# Heading 1\n\n## Heading 2' } });
		expect(screen.getByText('Heading 1').element().tagName).toBe('H1');
		expect(screen.getByText('Heading 2').element().tagName).toBe('H2');
	});

	it('renders paragraphs as block <div> (never <p>) for composition safety', async () => {
		const screen = await render(Markdown, { props: { children: 'Hello world' } });
		// Markdown paragraphs render as <div> so block-level inline content
		// (images, custom inline components) never trips the phrasing-content
		// trap that a <p> would impose. role="paragraph" re-exposes the paragraph
		// role to assistive tech without the <p> hazard. Consumers who want a real
		// <p> element can pass `components={{paragraph: 'p'}}`.
		const para = screen.getByText('Hello world').element();
		expect(para.tagName).toBe('DIV');
		expect(para).toHaveAttribute('role', 'paragraph');
	});

	it('renders the astryx-markdown-paragraph theme target on each paragraph', async () => {
		const screen = await render(Markdown, { props: { children: 'First para\n\nSecond para' } });
		const first = screen.getByText('First para').element();
		const second = screen.getByText('Second para').element();
		// Stable theme-target class lets a theme adjust the inter-paragraph gap
		// (marginBlockStart/marginBlockEnd) via defineTheme without reaching for
		// fragile descendant selectors or global spacing tokens.
		expect(first.className).toContain('astryx-markdown-paragraph');
		expect(second.className).toContain('astryx-markdown-paragraph');
	});

	describe('block spacing theme targets', () => {
		// Every block type renders a stable astryx-markdown-<block> class so a
		// theme can tune the gap around it (marginBlockStart/marginBlockEnd) via
		// defineTheme — the whole prose rhythm is themeable, not just paragraphs.
		it('renders a stable theme-target class on every block type', async () => {
			const screen = await render(Markdown, {
				props: {
					children: [
						'# Heading',
						'Paragraph text',
						'- item one',
						'```\ncode\n```',
						'> quoted',
						'| a | b |\n| - | - |\n| 1 | 2 |',
						'---',
						'![alt](https://example.com/x.png)'
					].join('\n\n')
				}
			});
			for (const cls of [
				'astryx-markdown-heading',
				'astryx-markdown-paragraph',
				'astryx-markdown-list',
				'astryx-markdown-codeblock',
				'astryx-markdown-blockquote',
				'astryx-markdown-table',
				'astryx-markdown-hr',
				'astryx-markdown-image'
			]) {
				expect(
					screen.container.querySelector(`.${cls}`),
					`expected a .${cls} element`
				).not.toBeNull();
			}
		});

		it('renders the theme target on task lists too', async () => {
			const screen = await render(Markdown, { props: { children: '- [ ] todo' } });
			expect(screen.container.querySelector('.astryx-markdown-list')).not.toBeNull();
		});

		it('reflects density on block targets as data-density', async () => {
			const screen = await render(Markdown, { props: { children: 'Hello world' } });
			// Default density is reflected so themes can tune spacing per density.
			await expect
				.element(screen.getByText('Hello world'))
				.toHaveAttribute('data-density', 'default');
			await screen.rerender({ density: 'compact', children: 'Hello world' });
			await expect
				.element(screen.getByText('Hello world'))
				.toHaveAttribute('data-density', 'compact');
		});

		it('reflects the heading level on the heading target as data-level', async () => {
			const screen = await render(Markdown, { props: { children: '## Section' } });
			const heading = screen.getByText('Section').element();
			expect(heading.className).toContain('astryx-markdown-heading');
			expect(heading).toHaveAttribute('data-level', '2');
		});

		it('does not apply the theme target when a custom block component is provided', async () => {
			const screen = await render(Markdown, {
				props: { components: { heading: MarkdownCustomHeading }, children: '# Custom heading' }
			});
			// Custom components own their own styling — the default target is not
			// imposed on them.
			expect(screen.container.querySelector('.astryx-markdown-heading')).toBeNull();
			expect(screen.container.querySelector('[data-custom]')).not.toBeNull();
		});
	});

	it('renders inline display without block wrappers', async () => {
		const screen = await render(Markdown, {
			props: { display: 'inline', children: 'Use `code` and **bold**' }
		});

		expect(screen.container.firstElementChild?.tagName).toBe('SPAN');
		await expect.element(screen.getByRole('document')).not.toBeInTheDocument();
		expect(screen.container.querySelector('p')).toBeNull();
		expect(screen.getByText('code').element().tagName).toBe('CODE');
		expect(screen.getByText('bold').element().tagName).toBe('STRONG');
	});

	it('renders links with inline display', async () => {
		const screen = await render(Markdown, {
			props: { display: 'inline', children: '[docs](/docs)' }
		});

		const link = screen.getByText('docs').element();
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('/docs');
	});

	it('renders bold text', async () => {
		const screen = await render(Markdown, { props: { children: '**bold text**' } });
		expect(screen.getByText('bold text').element().tagName).toBe('STRONG');
	});

	it('renders italic text', async () => {
		const screen = await render(Markdown, { props: { children: '*italic text*' } });
		expect(screen.getByText('italic text').element().tagName).toBe('EM');
	});

	it('renders strikethrough text', async () => {
		const screen = await render(Markdown, { props: { children: '~~struck~~' } });
		expect(screen.getByText('struck').element().tagName).toBe('DEL');
	});

	it('renders inline code with Code', async () => {
		const screen = await render(Markdown, { props: { children: 'Use `code` here' } });
		expect(screen.getByText('code').element().tagName).toBe('CODE');
	});

	it('renders code blocks with CodeBlock', async () => {
		const screen = await render(Markdown, { props: { children: '```js\nconst x = 1;\n```' } });
		// CodeBlock renders in a <pre>
		const pre = screen.container.querySelector('pre');
		expect(pre).toBeInTheDocument();
	});

	it('renders links with correct href', async () => {
		const screen = await render(Markdown, { props: { children: '[click](https://example.com)' } });
		const link = screen.getByText('click').element();
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('https://example.com');
	});

	it('adds target="_blank" to external links', async () => {
		const screen = await render(Markdown, { props: { children: '[ext](https://example.com)' } });
		const link = screen.getByText('ext').element();
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('renders a footer reference-style link as an anchor', async () => {
		// The XDS parser previously had no reference-definition support, so this
		// rendered as literal `[the docs][docs]` text with the definition leaking
		// as a paragraph. It now resolves to a real anchor.
		const screen = await render(Markdown, {
			props: { children: 'See [the docs][docs] here.\n\n[docs]: https://example.com/docs\n' }
		});
		const link = screen.getByText('the docs').element();
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('https://example.com/docs');
		// The definition line must not leak into the rendered output.
		await expect.element(screen.getByText(/\[docs\]:/)).not.toBeInTheDocument();
	});

	it('renders a shortcut reference-style link as an anchor', async () => {
		const screen = await render(Markdown, {
			props: { children: 'See [the docs].\n\n[the docs]: /docs' }
		});
		const link = screen.getByText('the docs').element();
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('/docs');
	});

	it('does not add target="_blank" to relative links', async () => {
		const screen = await render(Markdown, { props: { children: '[internal](/page)' } });
		const link = screen.getByText('internal').element();
		expect(link.getAttribute('target')).toBeNull();
	});

	it('calls onLinkClick when link is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(Markdown, {
			props: { onLinkClick: handleClick, children: '[click me](https://example.com)' }
		});
		// Upstream's `fireEvent.click`. Its handler returns `undefined`, so nothing
		// cancels the anchor's default action — a real click would navigate the
		// test page away. Dispatching the same cancelable event, with a
		// capture-phase `preventDefault` in front of it, is what `fireEvent.click`
		// does in jsdom and keeps the page put.
		const cancelDefault = (event: Event) => event.preventDefault();
		document.addEventListener('click', cancelDefault, true);
		try {
			screen
				.getByText('click me')
				.element()
				.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		} finally {
			document.removeEventListener('click', cancelDefault, true);
		}
		expect(handleClick).toHaveBeenCalledWith('https://example.com', expect.any(Object));
	});

	it('renders blockquotes', async () => {
		const screen = await render(Markdown, { props: { children: '> A quote' } });
		const bq = screen.container.querySelector('blockquote');
		expect(bq).toBeInTheDocument();
	});

	it('renders unordered lists', async () => {
		const screen = await render(Markdown, { props: { children: '- A\n- B\n- C' } });
		const ul = screen.container.querySelector('ul');
		expect(ul).toBeInTheDocument();
		expect(screen.container.querySelectorAll('li')).toHaveLength(3);
	});

	it('renders ordered lists', async () => {
		const screen = await render(Markdown, { props: { children: '1. A\n2. B' } });
		const ol = screen.container.querySelector('ol');
		expect(ol).toBeInTheDocument();
	});

	it('renders ordered list items as direct children of ol (no span wrapper)', async () => {
		const screen = await render(Markdown, {
			props: { children: '1. First\n2. Second\n3. Third' }
		});
		const ol = screen.container.querySelector('ol')!;
		const directChildren = Array.from(ol.children);
		// All direct children should be <li> elements — no <span> wrappers
		expect(directChildren.every((c) => c.tagName === 'LI')).toBe(true);
		expect(directChildren).toHaveLength(3);
	});

	it('applies counter-increment class to ordered list items', async () => {
		const screen = await render(Markdown, {
			props: { children: '1. First\n2. Second\n3. Third' }
		});
		const ol = screen.container.querySelector('ol')!;
		const lis = ol.querySelectorAll('li');
		// Each li should have the counter-increment class
		lis.forEach((li) => {
			expect(li.className).toContain('withCounter');
		});
	});

	it('applies counter-reset class to ordered list container', async () => {
		const screen = await render(Markdown, { props: { children: '1. First\n2. Second' } });
		const ol = screen.container.querySelector('ol')!;
		expect(ol.className).toContain('withCounter');
	});

	it('joins blank-line-separated 1./1./1. into a single ordered list', async () => {
		// Regression: LLM-style loose ordered lists (1.\n\n1.\n\n1.) used to
		// render as three separate <ol>s each restarting at 1.
		const screen = await render(Markdown, {
			props: { children: '1. apple\n\n1. banana\n\n1. cherry' }
		});
		const ols = screen.container.querySelectorAll('ol');
		expect(ols).toHaveLength(1);
		expect(ols[0].querySelectorAll('li')).toHaveLength(3);
	});

	it('forwards a non-default start onto the <ol> element', async () => {
		const screen = await render(Markdown, { props: { children: '5. five\n6. six\n7. seven' } });
		const ol = screen.container.querySelector('ol')!;
		expect(ol.getAttribute('start')).toBe('5');
	});

	it('renders task lists with checkboxes', async () => {
		const screen = await render(Markdown, { props: { children: '- [x] Done\n- [ ] Todo' } });
		const checkboxes = screen.container.querySelectorAll('input[type="checkbox"]');
		expect(checkboxes).toHaveLength(2);
		expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
	});

	it('renders tables', async () => {
		const screen = await render(Markdown, {
			props: { children: '| A | B |\n| --- | --- |\n| 1 | 2 |' }
		});
		expect(screen.container.querySelector('table')).toBeInTheDocument();
		expect(screen.container.querySelectorAll('th')).toHaveLength(2);
		expect(screen.container.querySelectorAll('td')).toHaveLength(2);
	});

	it('makes the table scroll wrapper keyboard-focusable', async () => {
		const screen = await render(Markdown, {
			props: { children: '| A | B |\n| --- | --- |\n| 1 | 2 |' }
		});
		const table = screen.container.querySelector('table');
		expect(table).toBeInTheDocument();
		// The GFM table's outer overflow wrapper is keyboard-focusable so keyboard
		// users can horizontally scroll a wide table.
		const wrapper = table!.closest('[role="group"][tabindex="0"]');
		expect(wrapper).toBeTruthy();
		expect(wrapper).toHaveAttribute('aria-label', 'Table');
	});

	it('renders horizontal rules', async () => {
		const screen = await render(Markdown, { props: { children: '---' } });
		expect(screen.container.querySelector('hr')).toBeInTheDocument();
	});

	it('renders images', async () => {
		const screen = await render(Markdown, { props: { children: '![alt text](image.png)' } });
		const img = screen.container.querySelector('img');
		expect(img).toBeInTheDocument();
		expect(img!.getAttribute('alt')).toBe('alt text');
		expect(img!.getAttribute('src')).toBe('image.png');
	});

	it('uses the components.image override for a standalone (block) image', async () => {
		// A standalone image line parses as a block image; its render path must
		// honor components.image just like the inline image path does.
		const screen = await render(Markdown, {
			props: { components: { image: MarkdownCustomImage }, children: '![alt text](image.png)' }
		});
		expect(screen.container.querySelector('img')).not.toBeInTheDocument();
		const custom = screen.container.querySelector('[data-testid="custom-image"]')!;
		expect(custom).toHaveTextContent('alt text');
		expect(custom.getAttribute('data-src')).toBe('image.png');
	});

	it('shifts heading levels with headingLevelStart', async () => {
		const screen = await render(Markdown, {
			props: { headingLevelStart: 3, children: '# Heading 1' }
		});
		expect(screen.getByText('Heading 1').element().tagName).toBe('H3');
	});

	it('shows streaming cursor when isStreaming is true', async () => {
		const screen = await render(Markdown, { props: { isStreaming: true, children: 'Hello' } });
		// Streaming mode parses incrementally but no cursor element
		expect(screen.container.querySelector('[role="document"]')).toBeInTheDocument();
	});

	it('hides cursor when not streaming', async () => {
		const screen = await render(Markdown, { props: { children: 'Hello' } });
		const cursor = screen.container.querySelector('span[aria-hidden]');
		expect(cursor).not.toBeInTheDocument();
	});

	it('applies compact density', async () => {
		const screen = await render(Markdown, { props: { density: 'compact', children: 'Hello' } });
		expect(screen.container.firstElementChild!.className).toContain('compact');
	});

	it('supports data-testid', async () => {
		const screen = await render(Markdown, {
			props: { 'data-testid': 'md', children: 'Hello' }
		});
		await expect.element(screen.getByTestId('md')).toBeInTheDocument();
	});

	it('forwards ref', async () => {
		// Counterpart to upstream's `ref` object. Svelte has no `ref`; the root is
		// reached through an attachment travelling in the rest props, which
		// `Markdown` spreads onto its root `<div>`.
		const attached = vi.fn();
		const screen = await render(Markdown, {
			props: {
				children: 'Hello',
				[createAttachmentKey()]: (node: Element) => attached(node)
			}
		});
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLDivElement);
	});

	it('sanitizes javascript: URLs in links', async () => {
		const screen = await render(Markdown, {
			props: { children: '[click](javascript:alert(1))' }
		});
		const link = screen.container.querySelector('a');
		expect(link).toBeNull();
		expect(screen.container.textContent).toContain('click');
	});

	it('sanitizes data: URLs in images', async () => {
		const screen = await render(Markdown, {
			props: { children: '![xss](data:text/html,<script>alert(1)</script>)' }
		});
		const img = screen.container.querySelector('img');
		expect(img).toBeNull();
	});

	it('allows safe URLs', async () => {
		const screen = await render(Markdown, {
			props: { children: '[safe](https://example.com) and [relative](/page)' }
		});
		const links = screen.container.querySelectorAll('a');
		expect(links).toHaveLength(2);
		expect(links[0].getAttribute('href')).toBe('https://example.com');
		expect(links[1].getAttribute('href')).toBe('/page');
	});
});

// ---------------------------------------------------------------------------
// inlinePlugins
// ---------------------------------------------------------------------------

// Helper: creates a plugin that turns JIRA-style ticket refs (PROJ-123) into links
function createTicketPlugin(): MarkdownPluginSpec {
	return { pattern: /\b([A-Z][A-Z0-9]+-\d+)\b/g, kind: 'ticket' };
}

// Helper: creates a plugin that turns X-numbers (X12345) into links
function createXRefPlugin(): MarkdownPluginSpec {
	return { pattern: /\bX(\d+)\b/g, kind: 'xref' };
}

describe('inlinePlugins', () => {
	it('transforms text patterns into custom elements', async () => {
		const ticketPlugin = createTicketPlugin();
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [ticketPlugin], source: 'Check out PROJ-123 for details' }
		});
		const link = screen.container.querySelector('[data-testid="ticket-link"]');
		expect(link).toBeInTheDocument();
		expect(link!.getAttribute('href')).toBe('https://issues.example.com/browse/PROJ-123');
		expect(link!.textContent).toBe('PROJ-123');
	});

	it('supports multiple plugins', async () => {
		const screen = await render(MarkdownInlinePlugins, {
			props: {
				specs: [createTicketPlugin(), createXRefPlugin()],
				source: 'See PROJ-123 and X99999'
			}
		});
		const ticketLink = screen.container.querySelector('[data-testid="ticket-link"]');
		const xrefLink = screen.container.querySelector('[data-testid="xref-link"]');
		expect(ticketLink).toBeInTheDocument();
		expect(ticketLink!.getAttribute('href')).toBe('https://issues.example.com/browse/PROJ-123');
		expect(xrefLink).toBeInTheDocument();
		expect(xrefLink!.getAttribute('href')).toBe('https://xref.example.com/99999');
	});

	it('does not transform patterns inside fenced code blocks', async () => {
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [createTicketPlugin()], source: '```\nPROJ-123\n```' }
		});
		const link = screen.container.querySelector('[data-testid="ticket-link"]');
		expect(link).toBeNull();
		expect(screen.container.textContent).toContain('PROJ-123');
	});

	it('does not transform patterns inside inline code', async () => {
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [createTicketPlugin()], source: 'Use `PROJ-123` in your code' }
		});
		const link = screen.container.querySelector('[data-testid="ticket-link"]');
		expect(link).toBeNull();
		expect(screen.container.textContent).toContain('PROJ-123');
	});

	it('works alongside regular markdown links', async () => {
		const screen = await render(MarkdownInlinePlugins, {
			props: {
				specs: [createTicketPlugin()],
				source: 'Visit [example](https://example.com) and check PROJ-123'
			}
		});
		const ticketLink = screen.container.querySelector('[data-testid="ticket-link"]');
		expect(ticketLink).toBeInTheDocument();
		const mdLink = screen.container.querySelector('a[href="https://example.com"]');
		expect(mdLink).toBeInTheDocument();
		expect(mdLink!.textContent).toBe('example');
	});

	it('first plugin wins for overlapping patterns', async () => {
		const narrowPlugin: MarkdownPluginSpec = { pattern: /PROJ-\d+/g, kind: 'narrow' };
		const broadPlugin: MarkdownPluginSpec = { pattern: /[A-Z]+-\d+/g, kind: 'broad' };
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [narrowPlugin, broadPlugin], source: 'Check PROJ-123' }
		});
		expect(screen.container.querySelector('[data-testid="narrow-match"]')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-testid="broad-match"]')).toBeNull();
	});

	it('skips matches when getEndIndex returns false', async () => {
		const plugin: MarkdownPluginSpec = {
			pattern: /\b([A-Z]+-\d+)\b/g,
			getEndIndex: () => false,
			kind: 'bareTicket'
		};
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [plugin], source: 'Check PROJ-123 for details' }
		});
		const link = screen.container.querySelector('[data-testid="ticket-link"]');
		expect(link).toBeNull();
		expect(screen.container.textContent).toContain('PROJ-123');
	});

	it('uses getEndIndex to adjust match boundaries', async () => {
		const plugin: MarkdownPluginSpec = {
			pattern: /TAG:/g,
			getEndIndex: (text, match) => {
				const afterMatch = text.slice(match.index! + match[0].length);
				const wordMatch = afterMatch.match(/^(\S+)/);
				if (wordMatch) {
					return match.index! + match[0].length + wordMatch[1].length;
				}
				return match.index! + match[0].length;
			},
			kind: 'tag'
		};
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [plugin], source: 'See TAG:important here' }
		});
		const tag = screen.container.querySelector('[data-testid="tag-match"]');
		expect(tag).toBeInTheDocument();
		expect(screen.container.textContent).toContain('here');
	});

	it('renders identically when no inlinePlugins are provided', async () => {
		const withPlugins = await render(Markdown, {
			props: { inlinePlugins: [], children: 'Hello **world** and `code`' }
		});
		const withoutPlugins = await render(Markdown, {
			props: { children: 'Hello **world** and `code`' }
		});
		expect(withPlugins.container.textContent).toBe(withoutPlugins.container.textContent);
	});

	it('transforms patterns inside bold/italic text', async () => {
		const screen = await render(MarkdownInlinePlugins, {
			props: { specs: [createTicketPlugin()], source: '**PROJ-123**' }
		});
		const link = screen.container.querySelector('[data-testid="ticket-link"]');
		expect(link).toBeInTheDocument();
		expect(link!.textContent).toBe('PROJ-123');
		expect(link!.closest('strong')).toBeInTheDocument();
	});

	describe('autolink prop', () => {
		it('renders bare URLs as plain text by default', async () => {
			const screen = await render(Markdown, {
				props: { children: 'see https://example.com here' }
			});
			expect(screen.container.querySelector('a')).toBeNull();
			expect(screen.container.textContent).toContain('https://example.com');
		});

		it('renders bare https URLs as links when autolink="gfm"', async () => {
			const screen = await render(Markdown, {
				props: { autolink: 'gfm', children: 'see https://example.com here' }
			});
			const link = screen.container.querySelector('a');
			expect(link).not.toBeNull();
			expect(link!.getAttribute('href')).toBe('https://example.com');
			expect(link!.textContent).toBe('https://example.com');
		});

		it('renders bare www URLs with http:// prefix', async () => {
			const screen = await render(Markdown, {
				props: { autolink: 'gfm', children: 'go www.example.com' }
			});
			const link = screen.container.querySelector('a');
			expect(link).not.toBeNull();
			expect(link!.getAttribute('href')).toBe('http://www.example.com');
			expect(link!.textContent).toBe('www.example.com');
		});

		it('renders bare emails with mailto: href', async () => {
			const screen = await render(Markdown, {
				props: { autolink: 'gfm', children: 'ping user@example.com please' }
			});
			const link = screen.container.querySelector('a');
			expect(link).not.toBeNull();
			expect(link!.getAttribute('href')).toBe('mailto:user@example.com');
			expect(link!.textContent).toBe('user@example.com');
		});

		it('does not autolink URLs inside code spans', async () => {
			const screen = await render(Markdown, {
				props: { autolink: 'gfm', children: 'try `https://example.com` here' }
			});
			expect(screen.container.querySelector('a')).toBeNull();
			expect(screen.container.querySelector('code')).not.toBeNull();
		});

		it('does not autolink URLs inside code blocks', async () => {
			const screen = await render(Markdown, {
				props: { autolink: 'gfm', children: '```\nhttps://example.com\n```' }
			});
			expect(screen.container.querySelector('a')).toBeNull();
			expect(screen.container.querySelector('pre')).not.toBeNull();
		});
	});
});
