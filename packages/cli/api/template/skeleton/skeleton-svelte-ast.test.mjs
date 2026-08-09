/**
 * @file **Beyond upstream, deliberately.** Upstream has no counterpart to this
 * file and could not: it covers the four behaviours that exist only because
 * `extractSkeleton` was rewritten from a TSX line scanner into a
 * `svelte/compiler` AST walk (see `skeleton.mjs`'s header for why the scanner
 * could not be translated). Every *ported* skeleton assertion lives in
 * `api/template/template.test.mjs`, matching upstream's count; nothing here
 * duplicates one.
 *
 * The bar CLAUDE.md sets for coverage beyond upstream is "a hazard with no
 * upstream analogue, which the ported suites structurally cannot catch". Each
 * case below names its hazard, and each fix was **mutation-checked**:
 *
 *  1. **Slots are snippets.** Upstream annotates `header={…}` — a JSX prop. The
 *     same slot is `{#snippet header()}` here, a node type the ported case
 *     never reaches because its fixture has no slots.
 *  2. **Control flow is a node, not a line.** `{#if}` / `{#each}` have no JSX
 *     analogue at all. Walking through them transparently is what keeps the
 *     depth stack from drifting; a scanner would have mis-nested here.
 *  3. **`style` is a CSS string, not a JS object.** Upstream reads
 *     `style={{maxWidth: 960}}`; a Svelte div carries `style="max-width:960px"`.
 *     *Mutation-checked the hard way — it shipped broken for one run.* Matching
 *     against the whole `style="…"` slice made the first declaration
 *     unreachable, because the patterns anchor on start-or-separator and the
 *     opening quote is neither: `padding` silently vanished from
 *     `style="padding: 16px; max-width: 960px"` while `max-width` was reported.
 *     Reading the attribute's *value* fixes it, and reverting `attributeValueText`
 *     drops `padding: 16px` from case 3 again.
 *  4. **A `<Card></Card>` is empty.** Upstream keys "self-closing" off a literal
 *     `/>` in the tag text, so an explicitly-empty element opens a depth its
 *     closing line then fails to pop. The AST reports emptiness directly.
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach } from 'vitest';
import { templateSkeleton } from './skeleton.mjs';

let tmpDir;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-skeleton-ast-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Run the skeleton leaf over a literal Svelte source.
 * @param {string} source
 * @returns {Promise<string>}
 */
async function skeletonOf(source) {
	const filePath = path.join(tmpDir, 'Fixture.svelte');
	fs.writeFileSync(filePath, source);
	const result = await templateSkeleton(
		{
			type: 'page',
			dirName: 'fixture',
			name: 'Fixture',
			description: '',
			filePath,
			docPath: filePath
		},
		[]
	);
	return result.data.skeleton;
}

describe('extractSkeleton — Svelte AST behaviours with no upstream analogue', () => {
	it('annotates a named snippet as a slot and keeps walking its body', async () => {
		const skeleton = await skeletonOf(
			`<AppShell>\n` +
				`\t{#snippet header()}\n` +
				`\t\t<Toolbar padding={2} />\n` +
				`\t{/snippet}\n` +
				`\t{#snippet notASlot()}\n` +
				`\t\t<Dialog />\n` +
				`\t{/snippet}\n` +
				`</AppShell>\n`
		);
		expect(skeleton).toContain('/* header: */');
		// The slot's body is emitted at the snippet's own depth, as upstream's
		// scanner leaves it.
		expect(skeleton).toContain('<Toolbar padding={2} />');
		// A snippet outside the annotated slot vocabulary gets no comment, but its
		// body is still walked.
		expect(skeleton).not.toContain('notASlot');
		expect(skeleton).toContain('<Dialog />');
	});

	it('walks through {#if} and {#each} without shifting depth', async () => {
		const skeleton = await skeletonOf(
			`<Layout>\n` +
				`\t{#if ready}\n` +
				`\t\t<Card padding={4}>\n` +
				`\t\t\t{#each rows as row}\n` +
				`\t\t\t\t<List />\n` +
				`\t\t\t{/each}\n` +
				`\t\t</Card>\n` +
				`\t{/if}\n` +
				`</Layout>\n`
		);
		expect(skeleton.split('\n')).toEqual([
			'<Layout>',
			'  <Card padding={4}>',
			'    <List />',
			'  </Card>',
			'</Layout>'
		]);
	});

	it('reads a CSS style string on a div, both attribute and directive forms', async () => {
		const attr = await skeletonOf(
			`<Section>\n` +
				`\t<div style="padding: 16px; max-width: 960px; gap: 8px">x</div>\n` +
				`</Section>\n`
		);
		expect(attr).toContain('/* div: padding: 16px, maxWidth: 960px, gap: 8px */');

		const directive = await skeletonOf(
			`<Section>\n\t<div style:margin-inline="auto" style:gap="4px">x</div>\n</Section>\n`
		);
		expect(directive).toContain('/* div: gap: 4px, marginInline: auto */');

		// A div with no spatial declarations is not annotated at all.
		const plain = await skeletonOf(`<Section>\n\t<div class="wrap">x</div>\n</Section>\n`);
		expect(plain).not.toContain('/* div:');
	});

	it('renders an explicitly-empty structural element as self-closing', async () => {
		const skeleton = await skeletonOf(`<Card padding={4}></Card>\n`);
		expect(skeleton).toBe('<Card padding={4} />');
	});
});
