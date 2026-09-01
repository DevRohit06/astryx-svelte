/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CodeBlock from '$lib/components/code-block/code-block.svelte';

/**
 * Regression tests with **no upstream counterpart**, and none is possible: the
 * failure is an artefact of how Svelte decides whitespace significance, and
 * React cannot reproduce it.
 *
 * JSX drops any whitespace run containing a newline, so upstream's
 * `<pre>{headerEl}{body}{copyButtonEl}</pre>` (`CodeBlock.tsx:907-937`) contains
 * no whitespace text nodes however it is indented. Svelte instead switches to
 * **preserve-whitespace mode** on entering a `<pre>` and keeps it for the whole
 * lexical subtree — so indenting those same children the ordinary way emits the
 * newlines and tabs as real text, and the `<pre>` UA rule `white-space: pre`
 * (which nothing in `code-block.stylex.ts` resets, matching upstream) renders
 * them.
 *
 * Most of it is invisible: `root`, `headerRow`, `header` and `collapseGrid` are
 * flex/grid containers, and a whitespace-*only* anonymous item is discarded per
 * spec. Exactly two boxes show it — `headerTitle`, whose whitespace is
 * contiguous with the title text so the anonymous item is not whitespace-only,
 * and `collapseInner`, a plain block box that gains blank lines. The symptom is
 * a header several lines tall with its label indented ~48 characters (the header
 * inherits the default `tab-size: 8`; the `tabSize: 2` in `styles.code` does not
 * reach it), overflowing `justify-content: space-between` and pushing the copy
 * button out of the clipped root.
 *
 * **The ported suites structurally cannot catch this.** Every one of the 13
 * cases in `code-block.svelte.test.ts` reaches the header through accessible-name
 * computation, which normalises whitespace — `getByRole('button', {name: 'x — ts'})`
 * matches just as well when the name is padded with newlines and tabs.
 *
 * The fix is structural rather than cosmetic: the `<pre>`'s children are
 * top-level `{#snippet}`s rendered with no literal whitespace between them, so
 * they are never lexically inside the `<pre>` and get ordinary trimming. Hand-
 * tightening the indentation instead would leave the bug one reformat away from
 * returning, which is why these cases assert the rendered text rather than the
 * source.
 *
 * Found by the idiom audit during the batch-5 (`CodeBlock`) port.
 *
 * **Every case here is mutation-checked**, and each names the mutation it
 * catches:
 *
 * 1. Inlining the header markup back into the `<pre>` with ordinary indentation
 *    fails cases 1 and 2 — the title reads `'\n\t\t\t\t\t\texample.ts — …'` and
 *    its box measures 80px against the 18px of one line.
 * 2. Inlining `collapsibleBody` the same way fails case 3.
 * 3. Wrapping the range-mode line text in a `<span>` fails case 4
 *    (`childNodes.length` 3 rather than 1).
 *
 * A fifth case asserting the copy button stays within the root was written and
 * then **removed**: it survived all three mutations, because the root clips with
 * `overflow: hidden` and the button's own box therefore never leaves it. A case
 * that cannot fail is noise, and is not worth the run time.
 */

/** Text content of the element, with no normalisation at all. */
function rawText(el: Element): string {
	return el.textContent ?? '';
}

describe('CodeBlock <pre> whitespace', () => {
	it('renders the header title with no surrounding whitespace', async () => {
		const screen = await render(CodeBlock, {
			code: 'const x = 1;',
			language: 'typescript',
			title: 'example.ts'
		});

		const title = screen.container.querySelector('[class*="astryx-codeblock"] span');
		expect(title).not.toBeNull();
		// Upstream renders exactly `{title}{' — '}{languageLabel}` and nothing else.
		expect(rawText(title as Element)).toBe('example.ts — typescript');
	});

	it('keeps the header on one line, not padded into a multi-line box', async () => {
		const screen = await render(CodeBlock, {
			code: 'const x = 1;',
			language: 'typescript',
			title: 'example.ts'
		});

		const title = screen.container.querySelector('[class*="astryx-codeblock"] span') as HTMLElement;
		const { height } = title.getBoundingClientRect();
		// A single line of supporting-size text. The broken version measured 55px
		// (three lines) against 18px here, so this threshold is far from the noise.
		expect(height).toBeLessThan(30);
	});

	it('adds no blank lines inside the collapsible region', async () => {
		const code = Array.from({ length: 12 }, (_, i) => `const line${i} = ${i};`).join('\n');
		const screen = await render(CodeBlock, {
			code,
			language: 'typescript',
			title: 'many.ts',
			isCollapsible: true
		});

		// `collapseInner` is the plain block box; its only child is the scroll
		// container, so its text must start at the first line of code.
		const region = screen.container.querySelector('[id$="-input"], [aria-expanded]');
		expect(region).not.toBeNull();

		const scroller = screen.container.querySelector('[role="group"]') as HTMLElement;
		const inner = scroller.parentElement as HTMLElement;
		expect(rawText(inner).startsWith('const line0')).toBe(true);
		expect(rawText(inner).endsWith('const line11 = 11;')).toBe(true);
	});

	it('keeps each range-mode line div a single text node, so highlight ranges can attach', async () => {
		const screen = await render(CodeBlock, {
			code: 'const x = 1;\nconst y = 2;',
			language: 'typescript',
			// Force range mode explicitly rather than relying on the environment probe.
			highlightMode: 'ranges'
		});

		const lines = screen.container.querySelectorAll('[data-line]');
		expect(lines.length).toBe(2);
		for (const line of lines) {
			// `applyLineRanges` bails unless `firstChild` is a Text node — a stray
			// whitespace text node or a wrapper element silently kills all colour.
			expect(line.firstChild?.nodeType).toBe(Node.TEXT_NODE);
			expect(line.childNodes.length).toBe(1);
		}
		expect(rawText(lines[0])).toBe('const x = 1;');
		expect(rawText(lines[1])).toBe('const y = 2;');
	});
});
