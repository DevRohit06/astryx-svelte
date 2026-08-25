import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Slots from './fixtures/command-palette-slots.svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';

/**
 * Ports three of upstream's `CommandPalette` suites case for case — the leaves
 * with no state of their own:
 *
 * - `CommandPaletteFooter.test.tsx` — 3 of 3
 * - `CommandPaletteGroup.test.tsx` — 8 of 8 (4 top-level plus the four-case
 *   `heading theme target` describe)
 * - `CommandPaletteList.test.tsx` — 4 of 4
 *
 * 15 upstream, 15 here, none dropped. None of the three files has a
 * `displayName` case or a snapshot.
 *
 * Kept in one file because all fifteen cases share
 * `command-palette-slots.svelte` (children are JSX upstream and a snippet here).
 * Their describe blocks are upstream's, so the counts stay readable per suite.
 *
 * Runs in the **client** (real Chromium) project, as every `.svelte.test.ts`
 * does; none of these needs a DOM feature jsdom lacks, but the fixture mounts
 * real components and `expect.element` retrying is the house style.
 *
 * RESTATED, in both heading cases: upstream reaches the heading with
 * `getByText`, which this runner will not do through an `aria-hidden` subtree,
 * so the heading is read off the DOM. The assertions themselves are upstream's.
 * The last theme case swaps `generateThemeCSSFlat` for this port's
 * `generateThemeCss`, which is the same function under the name it has here.
 */

describe('CommandPaletteFooter', () => {
	it('renders default keyboard hints', async () => {
		const screen = await render(Slots, { props: { render: 'footer-default' } });
		await expect.element(screen.getByText(/Navigate/)).toBeInTheDocument();
		await expect.element(screen.getByText(/Select/)).toBeInTheDocument();
		await expect.element(screen.getByText(/Close/)).toBeInTheDocument();
	});

	it('renders custom children instead of defaults', async () => {
		const screen = await render(Slots, {
			props: { render: 'footer', footerText: 'Custom footer content' }
		});
		await expect
			.element(screen.getByText('Custom footer content', { exact: true }))
			.toBeInTheDocument();
		expect(screen.container.textContent).not.toMatch(/Navigate/);
	});

	it('renders a single root element (separator is CSS border, not a DOM node)', async () => {
		const screen = await render(Slots, { props: { render: 'footer-default' } });
		// The top separator is a borderBlockStart CSS property — no extra DOM node.
		expect(screen.container.querySelector('.astryx-command-palette-footer')).not.toBeNull();
		expect(screen.container.querySelector('[role="separator"]')).toBeNull();
	});
});

describe('CommandPaletteGroup', () => {
	it('renders heading', async () => {
		const screen = await render(Slots, { props: { render: 'group', heading: 'Navigation' } });
		await expect.element(screen.getByText('Navigation', { exact: true })).toBeInTheDocument();
	});

	it('renders children', async () => {
		const screen = await render(Slots, {
			props: { render: 'group', heading: 'Group', items: ['Child 1', 'Child 2'] }
		});
		await expect.element(screen.getByText('Child 1', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Child 2', { exact: true })).toBeInTheDocument();
	});

	it('has group role with aria-label', async () => {
		const screen = await render(Slots, { props: { render: 'group', heading: 'Actions' } });
		await expect.element(screen.getByRole('group')).toHaveAttribute('aria-label', 'Actions');
	});

	it('heading is aria-hidden', async () => {
		const screen = await render(Slots, { props: { render: 'group', heading: 'Hidden Heading' } });
		// `getByText` skips `aria-hidden` subtrees in this runner, so the heading is
		// reached through the DOM — the assertion is upstream's either way.
		const heading = screen.container.querySelector('.astryx-command-palette-group > div');
		expect(heading?.textContent?.trim()).toBe('Hidden Heading');
		expect(heading).toHaveAttribute('aria-hidden', 'true');
	});

	// =========================================================================
	// Heading theme target
	// =========================================================================

	describe('heading theme target', () => {
		it('renders the astryx-command-palette-group-heading target on the heading', async () => {
			const screen = await render(Slots, { props: { render: 'group', heading: 'Suggestions' } });
			const heading = screen.container.querySelector('.astryx-command-palette-group > div');

			// The root carries `astryx-command-palette-group`; this is the stable
			// handle on the heading itself, so a theme can style just the heading
			// without a fragile structural selector.
			expect(heading).toHaveClass('astryx-command-palette-group-heading');
		});

		it('keeps the heading target distinct from the group root target', async () => {
			const screen = await render(Slots, { props: { render: 'group', heading: 'Suggestions' } });
			const root = screen.getByRole('group').element();
			const heading = screen.container.querySelector('.astryx-command-palette-group > div');

			expect(root).toHaveClass('astryx-command-palette-group');
			expect(root).not.toHaveClass('astryx-command-palette-group-heading');
			expect(heading).not.toHaveClass('astryx-command-palette-group');
		});

		it('leaves the heading decorative (additive target only)', async () => {
			// The target adds a class and nothing else — the heading stays
			// aria-hidden so grouping remains announced via the root's aria-label.
			const screen = await render(Slots, { props: { render: 'group', heading: 'Suggestions' } });
			const heading = screen.container.querySelector('.astryx-command-palette-group > div');
			expect(heading?.textContent?.trim()).toBe('Suggestions');
			expect(heading).toHaveAttribute('aria-hidden', 'true');
		});

		it('exposes command-palette-group-heading as a themeable defineTheme target', () => {
			// The generated CSS proves the target is reachable by a theme: the
			// `@layer` cascade is not resolvable from a unit assertion, so the
			// DOM-class assertions above and this generation assertion together
			// cover the seam.
			const theme = defineTheme({
				name: 'command-palette-group-heading-test',
				components: {
					'command-palette-group-heading': {
						base: {
							paddingBlock: 'var(--spacing-2)',
							fontWeight: 'var(--font-weight-bold)'
						}
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-command-palette-group-heading {');
			expect(css).toContain('padding-block: var(--spacing-2)');
			expect(css).toContain('font-weight: var(--font-weight-bold)');
		});
	});
});

describe('CommandPaletteList', () => {
	it('renders children', async () => {
		const screen = await render(Slots, {
			props: { render: 'list', items: ['Item 1', 'Item 2'] }
		});
		await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2', { exact: true })).toBeInTheDocument();
	});

	it('has listbox role', async () => {
		const screen = await render(Slots, { props: { render: 'list' } });
		await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
	});

	it('has default aria-label', async () => {
		const screen = await render(Slots, { props: { render: 'list' } });
		await expect.element(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Commands');
	});

	it('supports custom label', async () => {
		const screen = await render(Slots, { props: { render: 'list', label: 'Search results' } });
		await expect
			.element(screen.getByRole('listbox'))
			.toHaveAttribute('aria-label', 'Search results');
	});
});
