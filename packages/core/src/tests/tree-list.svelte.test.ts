import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
import TreeListFixture from './fixtures/tree-list-fixture.svelte';
import type { TreeListFixtureItem } from './fixtures/tree-list-fixture.svelte';

/**
 * Ported from Astryx's `TreeList/TreeList.test.tsx` — **all 76 of its `it`
 * cases** at the 0.5.0 pin. Client (real Chromium) project: focus, roving tabindex and
 * the APG tree keyboard model are the bulk of what is here.
 *
 * The header read "**71 of its 76** at v0.4.1" and named the five that were
 * absent: the whole `leaf chevron-column offset` describe, parked against
 * #4838's chevron unit. **That parking has expired** — the chevron unit landed,
 * `tree-list-item.svelte` computes `reservesChevronColumn` exactly as upstream
 * does, and all five are ported here in upstream's position, between `variant`
 * and `row gap lever`. All five passed on the first run.
 *
 * The **five `row gap lever` cases are new at 0.4.1 (#4540)** and are here.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "all 47 of its `it` cases, nothing dropped".
 * Upstream had **66** at 0.3.0; the nineteen that were absent — one focus-scoping
 * case and four whole describes (`variant`, `guide theme target`, `indent lever`,
 * `chevron theme target`, `item label theme target`) — were added then, closing
 * the file against that tag. Two translations they need, neither weakening
 * anything:
 *
 * - `generateThemeTestCSS` becomes `generateThemeCss`, this port's function of
 *   the same job and shape (as `multi-selector` and `selector` do).
 * - `fireEvent.keyDown(document.body, {key: 'Tab'})` becomes the same
 *   dispatched `KeyboardEvent`. Upstream fires it to pin jsdom's
 *   `:focus-visible` approximation; a real Chromium needs the same nudge for
 *   the same reason, since an earlier `userEvent.click` leaves the page in
 *   pointer modality.
 *
 * Standing translations:
 *
 * - `startContent`/`endContent`/`header` are `Snippet`s here, so the items go
 *   through `tree-list-fixture`, which names the two slots by string and fills
 *   them from its own template. The tree is recursive data on both sides —
 *   `TreeList` never took compositional children — so nothing else changes.
 * - `screen.getByText(x)` becomes the `labelOf` helper and
 *   `screen.getByText(x).closest('li')` becomes `rowOf`. A Playwright locator
 *   cannot stand in: an expanded parent's `<li>` contains its children's text,
 *   so `getByText('Parent')` matches several elements and trips strict mode.
 *   Testing Library's default matcher reads only an element's *own* text nodes,
 *   which is what `labelOf` reproduces — and it is what makes upstream's
 *   `getByText` single-match in the first place.
 * - `container.querySelector('button' | 'a')` is used verbatim; the fixture's
 *   `container` is the same DOM root.
 */

const simpleItems: TreeListFixtureItem[] = [
	{ id: 'a', label: 'Item A' },
	{ id: 'b', label: 'Item B' }
];

const nestedItems: TreeListFixtureItem[] = [
	{
		id: 'parent',
		label: 'Parent',
		children: [
			{ id: 'child-1', label: 'Child 1' },
			{ id: 'child-2', label: 'Child 2' }
		]
	},
	{ id: 'sibling', label: 'Sibling' }
];

const nestedItemsExpanded: TreeListFixtureItem[] = [
	{
		id: 'parent',
		label: 'Parent',
		isExpanded: true,
		children: [
			{ id: 'child-1', label: 'Child 1' },
			{ id: 'child-2', label: 'Child 2' }
		]
	},
	{ id: 'sibling', label: 'Sibling' }
];

const deepItems: TreeListFixtureItem[] = [
	{
		id: 'root',
		label: 'Root',
		isExpanded: true,
		children: [
			{
				id: 'mid',
				label: 'Mid',
				isExpanded: true,
				children: [{ id: 'leaf', label: 'Leaf' }]
			}
		]
	}
];

// APG keyboard fixtures.
const flatItems: TreeListFixtureItem[] = [
	{ id: 'a', label: 'Apple' },
	{ id: 'b', label: 'Banana' },
	{ id: 'c', label: 'Cherry' }
];

const withDisabledItems: TreeListFixtureItem[] = [
	{ id: 'a', label: 'Apple' },
	{ id: 'b', label: 'Banana', isDisabled: true },
	{ id: 'c', label: 'Cherry' }
];

const collapsedParentItems: TreeListFixtureItem[] = [
	{
		id: 'parent',
		label: 'Parent',
		children: [
			{ id: 'child-1', label: 'Child 1' },
			{ id: 'child-2', label: 'Child 2' }
		]
	},
	{ id: 'sibling', label: 'Sibling' }
];

const expandedParentItems: TreeListFixtureItem[] = [
	{
		id: 'parent',
		label: 'Parent',
		isExpanded: true,
		children: [
			{ id: 'child-1', label: 'Child 1' },
			{ id: 'child-2', label: 'Child 2' }
		]
	},
	{ id: 'sibling', label: 'Sibling' }
];

/**
 * The innermost `<span>` whose own text is `label` — upstream's
 * `screen.getByText(label)`. A locator would be a strict-mode violation here: an
 * expanded parent's `<li>` contains its children's text too, so several elements
 * match. Testing Library's default matcher looks only at an element's own text
 * nodes, which is what this reproduces.
 */
function labelOf(container: HTMLElement, label: string): HTMLElement {
	const el = Array.from(container.querySelectorAll<HTMLElement>('span')).find(
		(span) =>
			Array.from(span.childNodes)
				.filter((n) => n.nodeType === Node.TEXT_NODE)
				.map((n) => n.textContent ?? '')
				.join('')
				.trim() === label
	);
	if (!el) throw new Error(`no element with the text "${label}"`);
	return el;
}

/** Upstream's `screen.getByText(label).closest('li')`. */
function rowOf(container: HTMLElement, label: string): HTMLElement {
	const li = labelOf(container, label).closest<HTMLElement>('[role="treeitem"]');
	if (!li) throw new Error(`no treeitem labelled "${label}"`);
	return li;
}

/**
 * Every CSS rule the page has, however it was injected — upstream's
 * `collectCssText`. `setup-stylex.ts` installs the repo-wide compiled sheet.
 */
function injectedCss(): string {
	let out = '';
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			for (const rule of Array.from(sheet.cssRules)) {
				out += rule.cssText + '\n';
			}
		} catch {
			// ignore cross-origin sheets
		}
	}
	out += Array.from(document.querySelectorAll('style'))
		.map((s) => s.textContent || '')
		.join('\n');
	return out;
}

/**
 * Whether any rule targeting one of `element`'s own classes makes `declaration`.
 * Scoped rather than a global grep: the injected sheet is repo-wide, so an
 * unscoped match would pass on any other component's declaration.
 */
function hasDeclarationFor(element: Element, declaration: RegExp): boolean {
	const css = injectedCss();
	return Array.from(element.classList).some((cls) =>
		new RegExp(`\\.${cls}\\b[^{]*\\{[^}]*${declaration.source}`, 'i').test(css)
	);
}

/** Upstream's `queryByText(label) != null`. */
function labelExists(container: HTMLElement, label: string): boolean {
	return Array.from(container.querySelectorAll<HTMLElement>('span')).some(
		(span) =>
			Array.from(span.childNodes)
				.filter((n) => n.nodeType === Node.TEXT_NODE)
				.map((n) => n.textContent ?? '')
				.join('')
				.trim() === label
	);
}

describe('TreeList', () => {
	// =========================================================================
	// Basic rendering
	// =========================================================================

	it('renders items', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(labelExists(screen.container, 'Item A')).toBe(true);
		expect(labelExists(screen.container, 'Item B')).toBe(true);
	});

	it('renders with data-testid', async () => {
		const screen = await render(TreeListFixture, {
			props: { items: simpleItems, tree: { 'data-testid': 'tree' } }
		});
		await expect.element(screen.getByTestId('tree')).toBeInTheDocument();
	});

	it('renders description text', async () => {
		const items: TreeListFixtureItem[] = [
			{ id: 'a', label: 'Label', description: 'Description text' }
		];
		const screen = await render(TreeListFixture, { props: { items } });
		expect(labelExists(screen.container, 'Description text')).toBe(true);
	});

	// =========================================================================
	// Semantic HTML
	// =========================================================================

	it('renders a tree role on the list', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(screen.container.querySelector('[role="tree"]')).toBeInTheDocument();
	});

	it('renders treeitem role on items', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(screen.container.querySelectorAll('[role="treeitem"]')).toHaveLength(2);
	});

	it('renders items as <li> elements', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(screen.container.querySelectorAll('li')).toHaveLength(2);
	});

	// =========================================================================
	// Header with aria-labelledby
	// =========================================================================

	it('renders header and associates via aria-labelledby', async () => {
		const screen = await render(TreeListFixture, {
			props: { items: simpleItems, headerText: 'File Tree' }
		});
		expect(labelExists(screen.container, 'File Tree')).toBe(true);
		const tree = screen.container.querySelector('[role="tree"]')!;
		const headerId = tree.getAttribute('aria-labelledby');
		expect(headerId).toBeTruthy();
		const headerEl = document.getElementById(headerId!);
		expect(headerEl?.textContent?.trim()).toBe('File Tree');
	});

	it('does not render aria-labelledby when no header', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(screen.container.querySelector('[role="tree"]')).not.toHaveAttribute('aria-labelledby');
	});

	// =========================================================================
	// Expansion (internal state)
	// =========================================================================

	it('does not render children by default', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItems } });
		expect(labelExists(screen.container, 'Parent')).toBe(true);
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
	});

	it('renders children when item has isExpanded: true', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
		expect(labelExists(screen.container, 'Child 1')).toBe(true);
		expect(labelExists(screen.container, 'Child 2')).toBe(true);
	});

	it('sets aria-expanded on items with children', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
		expect(rowOf(screen.container, 'Parent')).toHaveAttribute('aria-expanded', 'true');
	});

	it('sets aria-expanded=false on collapsed items with children', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItems } });
		expect(rowOf(screen.container, 'Parent')).toHaveAttribute('aria-expanded', 'false');
	});

	it('does not set aria-expanded on leaf items', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(rowOf(screen.container, 'Item A')).not.toHaveAttribute('aria-expanded');
	});

	it('renders a keyboard-focusable toggle button for parents without onClick/href', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItems } });
		const toggle = screen.getByRole('button', { name: 'Toggle children' });
		await expect.element(toggle).toBeInTheDocument();
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('expands a parent from the keyboard via the toggle button', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItems } });
		// Collapsed: children are not rendered.
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
		const toggle = screen.getByRole('button', { name: 'Toggle children' }).element() as HTMLElement;
		toggle.focus();
		expect(document.activeElement).toBe(toggle);
		await userEvent.keyboard('{Enter}');
		expect(labelExists(screen.container, 'Child 1')).toBe(true);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
	});

	it('renders group role for nested children', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
		expect(screen.container.querySelectorAll('[role="group"]').length).toBeGreaterThanOrEqual(1);
	});

	it('expands a collapsed item when clicked', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItems } });
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
		await userEvent.click(labelOf(screen.container, 'Parent'));
		expect(labelExists(screen.container, 'Child 1')).toBe(true);
	});

	it('collapses an expanded item when clicked', async () => {
		const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
		expect(labelExists(screen.container, 'Child 1')).toBe(true);
		await userEvent.click(labelOf(screen.container, 'Parent'));
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
	});

	// =========================================================================
	// Deep nesting
	// =========================================================================

	it('renders deeply nested items when all expanded', async () => {
		const screen = await render(TreeListFixture, { props: { items: deepItems } });
		expect(labelExists(screen.container, 'Root')).toBe(true);
		expect(labelExists(screen.container, 'Mid')).toBe(true);
		expect(labelExists(screen.container, 'Leaf')).toBe(true);
	});

	// =========================================================================
	// Focus-visible outline scoping (regression: focusing a parent row must not
	// leak the ring onto descendant rows — see #4130)
	// =========================================================================

	it('scopes the focus-visible outline to the focused row, not its descendants', async () => {
		const screen = await render(TreeListFixture, { props: { items: deepItems } });
		const root = rowOf(screen.container, 'Root');
		const mid = rowOf(screen.container, 'Mid');
		const leaf = rowOf(screen.container, 'Leaf');

		// Upstream fires `fireEvent.keyDown(document.body, {key: 'Tab'})` before
		// `.focus()` to establish keyboard modality, "so jsdom's :focus-visible
		// heuristic applies deterministically, regardless of pointer events left
		// over from other tests in this file". RESTATED in mechanism only: a
		// *synthetic* KeyboardEvent is untrusted, and Chromium's focus-visible
		// flag is only set by real user input, so the dispatched event would leave
		// the page in pointer modality and `--_tree-focus-outline` at its default.
		// A real Tab through Playwright sets the same modality upstream is after,
		// and the explicit `.focus()` that follows is upstream's, unchanged — it
		// is what pins *which* row is focused.
		await userEvent.tab();
		root.focus();
		expect(root).toHaveFocus();

		// `--_focus-outline` is the shared name `focusOutlineProps
		// .publishFocusVisibleVars` publishes, and is upstream's — there is no
		// tree-specific outline var on either side.
		//
		// Upstream compares the whole value against its exported `FOCUS_OUTLINE`.
		// RESTATED: that constant is three `var()` references, and jsdom hands back
		// the token stream as specified where a real browser substitutes them, so
		// the literal comparison cannot hold here. Asserting the style keyword
		// pins the same thing the comparison is for — that the ring is drawn at all
		// — against a value this environment actually resolves.
		expect(getComputedStyle(root).getPropertyValue('--_focus-outline')).toContain('solid');
		// Mid and Leaf are DOM descendants of Root's <li> (nested <ul role="group">
		// subtrees) — their own outline var must stay unset, not inherit Root's.
		expect(getComputedStyle(mid).getPropertyValue('--_focus-outline')).toBe('none');
		expect(getComputedStyle(leaf).getPropertyValue('--_focus-outline')).toBe('none');
	});

	// =========================================================================
	// Interactive items
	// =========================================================================

	it('renders an invisible button when onClick is provided', async () => {
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Clickable', onClick: () => {} }];
		const screen = await render(TreeListFixture, { props: { items } });
		const button = screen.container.querySelector('button');
		expect(button).toBeInTheDocument();
		expect(button?.textContent).toContain('Clickable');
	});

	it('fires onClick when invisible button is clicked', async () => {
		const onClick = vi.fn();
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Clickable', onClick }];
		const screen = await render(TreeListFixture, { props: { items } });
		await userEvent.click(screen.container.querySelector('button')!);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('renders an invisible anchor when href is provided', async () => {
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Link', href: '/docs' }];
		const screen = await render(TreeListFixture, { props: { items } });
		const anchor = screen.container.querySelector('a');
		expect(anchor).toBeInTheDocument();
		expect(anchor).toHaveAttribute('href', '/docs');
	});

	it('does not render button or anchor for static items', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(screen.container.querySelector('button')).not.toBeInTheDocument();
		expect(screen.container.querySelector('a')).not.toBeInTheDocument();
	});

	// =========================================================================
	// Disabled state
	// =========================================================================

	it('applies aria-disabled when isDisabled', async () => {
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Disabled', isDisabled: true }];
		const screen = await render(TreeListFixture, { props: { items } });
		expect(rowOf(screen.container, 'Disabled')).toHaveAttribute('aria-disabled', 'true');
	});

	// =========================================================================
	// Selected state
	// =========================================================================

	it('applies aria-selected when isSelected', async () => {
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Selected', isSelected: true }];
		const screen = await render(TreeListFixture, { props: { items } });
		expect(rowOf(screen.container, 'Selected')).toHaveAttribute('aria-selected', 'true');
	});

	it('does not apply aria-selected when not selected', async () => {
		const screen = await render(TreeListFixture, { props: { items: simpleItems } });
		expect(rowOf(screen.container, 'Item A')).not.toHaveAttribute('aria-selected');
	});

	// =========================================================================
	// startContent and endContent
	// =========================================================================

	it('renders startContent', async () => {
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'With Icon', startSlot: 'star' }];
		const screen = await render(TreeListFixture, { props: { items } });
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders endContent', async () => {
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'With Badge', endSlot: 'badge' }];
		const screen = await render(TreeListFixture, { props: { items } });
		await expect.element(screen.getByTestId('badge')).toBeInTheDocument();
	});

	// =========================================================================
	// Density
	// =========================================================================

	it('renders with compact density', async () => {
		const screen = await render(TreeListFixture, {
			props: { items: simpleItems, tree: { density: 'compact' } }
		});
		expect(screen.container.querySelector('[role="tree"]')).toBeInTheDocument();
	});

	it('renders with spacious density', async () => {
		const screen = await render(TreeListFixture, {
			props: { items: simpleItems, tree: { density: 'spacious' } }
		});
		expect(screen.container.querySelector('[role="tree"]')).toBeInTheDocument();
	});

	// =========================================================================
	// Variant (guide lines)
	// =========================================================================

	describe('variant', () => {
		it('renders guide lines by default', async () => {
			const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
			expect(screen.container.querySelector('.astryx-tree-list-guide')).not.toBeNull();
		});

		it("variant='lineGuides' renders guide lines (explicit == default)", async () => {
			const screen = await render(TreeListFixture, {
				props: { items: nestedItemsExpanded, tree: { variant: 'lineGuides' } }
			});
			expect(screen.container.querySelector('.astryx-tree-list-guide')).not.toBeNull();
		});

		it("variant='noGuides' renders NO guide lines", async () => {
			const screen = await render(TreeListFixture, {
				props: { items: nestedItemsExpanded, tree: { variant: 'noGuides' } }
			});
			expect(screen.container.querySelector('.astryx-tree-list-guide')).toBeNull();
		});

		it("variant='noGuides' preserves the tree structure and items", async () => {
			const screen = await render(TreeListFixture, {
				props: { items: nestedItemsExpanded, tree: { variant: 'noGuides' } }
			});
			// Rows, roles, and nesting are all intact — only the connectors are gone.
			await expect.element(screen.getByRole('tree')).toBeInTheDocument();
			expect(screen.getByRole('treeitem').elements()).toHaveLength(4);
			expect(labelExists(screen.container, 'Parent')).toBe(true);
			expect(labelExists(screen.container, 'Child 1')).toBe(true);
			expect(labelExists(screen.container, 'Child 2')).toBe(true);
			expect(labelExists(screen.container, 'Sibling')).toBe(true);
		});

		it("variant='noGuides' preserves per-level indentation on the rows", async () => {
			// Indentation lives on the row's margin-inline-start (not the guide
			// element), so it must survive when the connectors are suppressed. The
			// per-row distance is published as the `--_tree-indent` custom property
			// (not an inline longhand — see #4308), so the theme layer can override
			// the `margin-inline-start` declaration. A deeper row is indented more
			// than a shallower one.
			const screen = await render(TreeListFixture, {
				props: { items: deepItems, tree: { variant: 'noGuides' } }
			});
			const indentOf = (text: string): string => {
				const li = rowOf(screen.container, text);
				const styled = li.querySelector('[style*="--_tree-indent"]');
				return styled?.getAttribute('style') ?? '';
			};
			// Guides are gone…
			expect(screen.container.querySelector('.astryx-tree-list-guide')).toBeNull();
			// …but each level still publishes an indent distance, and the level
			// multiplier grows with depth (0, 1, 2).
			expect(indentOf('Root')).toContain('--_tree-indent');
			expect(indentOf('Mid')).toContain('--_tree-indent');
			expect(indentOf('Leaf')).toContain('--_tree-indent');
			const level = (text: string): number => {
				const m = /calc\((\d+)/.exec(indentOf(text));
				return m ? Number(m[1]) : NaN;
			};
			expect(level('Mid')).toBeGreaterThan(level('Root'));
			expect(level('Leaf')).toBeGreaterThan(level('Mid'));
		});
	});

	// =========================================================================
	// Guide theme target
	// =========================================================================

	describe('guide theme target', () => {
		it('renders the astryx-tree-list-guide target on the connector lines', async () => {
			const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
			const guide = screen.container.querySelector('.astryx-tree-list-guide');
			// A dedicated, stable target so a theme can recolor or hide the guides
			// without hiding the built-in connectors and reimplementing them.
			expect(guide).not.toBeNull();
		});

		it('exposes tree-list-guide as a themeable defineTheme target', () => {
			// The @layer cascade is not observable from JS, so the generated CSS is
			// what proves a theme override reaches the guide element.
			// `generateThemeCss` is this port's `generateThemeTestCSS`.
			const theme = defineTheme({
				name: 'tree-list-guide-test',
				components: {
					'tree-list-guide': {
						base: { backgroundColor: 'var(--color-accent)' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-tree-list-guide {');
			expect(css).toContain('background-color: var(--color-accent)');
		});

		it('lets a theme hide the guides via display: none on the target', () => {
			// Hiding the guides is done through the theme target, not a prop — the
			// theme rule lands in @layer astryx-theme, above StyleX's base layer.
			const theme = defineTheme({
				name: 'tree-list-guide-hidden-test',
				components: {
					'tree-list-guide': {
						base: { display: 'none' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-tree-list-guide {');
			expect(css).toContain('display: none');
		});
	});

	// =========================================================================
	// Indent lever (--tree-list-indent)
	// =========================================================================

	describe('indent lever', () => {
		it('lets a theme retune the indent step via the tree-list target', () => {
			// The per-level step is a public, themeable var (default --spacing-4) set
			// on the tree-list root, so a theme can retune the indent metric (e.g. to
			// --spacing-5) via defineTheme. The @layer cascade is not observable from
			// JS, so the generated CSS is what proves the override reaches the lever.
			const theme = defineTheme({
				name: 'tree-list-indent-test',
				components: {
					'tree-list': {
						base: { '--tree-list-indent': 'var(--spacing-5)' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-tree-list {');
			expect(css).toContain('--tree-list-indent: var(--spacing-5)');
		});

		it('rows consume the indent step in their published indent distance', async () => {
			// Each row's --_tree-indent is calc(level * var(--tree-list-indent)),
			// so retuning the step scales every level uniformly.
			const screen = await render(TreeListFixture, {
				props: { items: deepItems, tree: { variant: 'noGuides' } }
			});
			const indentOf = (text: string): string => {
				const li = rowOf(screen.container, text);
				const styled = li.querySelector('[style*="--_tree-indent"]');
				return styled?.getAttribute('style') ?? '';
			};
			expect(indentOf('Mid')).toContain('var(--tree-list-indent)');
			expect(indentOf('Leaf')).toContain('var(--tree-list-indent)');
		});
	});

	// =========================================================================
	// Leaf chevron-column offset (group-expandable-sibling awareness)
	// =========================================================================

	describe('leaf chevron-column offset', () => {
		// A row publishes its indent as the inline `--_tree-indent` custom property.
		// A leaf that reserves the chevron column adds a fixed offset
		// (chevron width + gap) on top of its level indent; a flush leaf does not.
		// The reserved column is expressed as the literal `+ <spacing-4> + <spacing-2>`
		// suffix in the calc(), so its presence is what we assert (the token values
		// are not resolved by reading the declared style, so we check the structure,
		// not pixels).
		const indentStyleOf = (container: HTMLElement, text: string): string => {
			const li = rowOf(container, text);
			const styled = li.querySelector('[style*="--_tree-indent"]');
			return styled?.getAttribute('style') ?? '';
		};
		// A reserved chevron column adds two extra terms to the indent calc()
		// beyond the single `level * var(--tree-list-indent)` term.
		const reservesColumn = (container: HTMLElement, text: string): boolean => {
			const style = indentStyleOf(container, text);
			// count the `var(` occurrences inside --_tree-indent: a flush row has
			// exactly one (the indent step); a reserving leaf adds the chevron
			// width + gap tokens, so it has more.
			const m = /--_tree-indent:\s*calc\(([^;]*)\)/.exec(style);
			const body = m?.[1] ?? '';
			return (body.match(/\bvar\(/g)?.length ?? 0) > 1 || body.includes('+');
		};

		it('a leaf in a mixed group reserves the chevron column (aligns under its expandable sibling)', async () => {
			// Group: [Parent (has children), Sibling (leaf)] → Sibling must line up
			// under Parent's caret, so it keeps the chevron-column offset.
			const screen = await render(TreeListFixture, { props: { items: nestedItems } });
			expect(reservesColumn(screen.container, 'Sibling')).toBe(true);
		});

		it('a leaf under an expandable ancestor reserves the chevron column even when its own group is all leaves', async () => {
			// 'Root' → 'Mid' → 'Leaf'; 'Leaf' is the only item in its immediate
			// group, but the tree has carets (Root, Mid), so Leaf must reserve the
			// chevron column to stay indented past its parent's label. Flushing it
			// here would push it left of Mid's label — the all-leaf-group bug.
			const screen = await render(TreeListFixture, {
				props: { items: deepItems, tree: { variant: 'noGuides' } }
			});
			expect(reservesColumn(screen.container, 'Leaf')).toBe(true);
		});

		it("an expanded parent's all-leaf children reserve the chevron column (do not flush left of the parent label)", async () => {
			// Regression: Parent (caret) → [Child 1, Child 2] is an all-leaf group
			// nested under an expandable parent. Per-group flushing wrongly dropped
			// these children's chevron column, pushing them LEFT of Parent's own
			// label. Because the tree has a caret, they must reserve the column and
			// stay indented past Parent.
			const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
			expect(reservesColumn(screen.container, 'Child 1')).toBe(true);
			expect(reservesColumn(screen.container, 'Child 2')).toBe(true);
		});

		it('every row in a flat (all-leaf) tree sits flush — no chevron column reserved', async () => {
			const screen = await render(TreeListFixture, { props: { items: flatItems } });
			expect(reservesColumn(screen.container, 'Apple')).toBe(false);
			expect(reservesColumn(screen.container, 'Banana')).toBe(false);
			expect(reservesColumn(screen.container, 'Cherry')).toBe(false);
		});

		it('leaves flush in an all-leaf group have the same indent structure as a parent at that level', async () => {
			// In a mixed group the reserving leaf indent has the extra terms; in an
			// all-leaf group the leaf indent is the bare level step, exactly like a
			// parent row's indent.
			const screen = await render(TreeListFixture, { props: { items: flatItems } });
			const flush = indentStyleOf(screen.container, 'Apple');
			// bare level step: one var(--tree-list-indent), no additive chevron terms
			expect(flush).toContain('var(--tree-list-indent)');
			expect(/--_tree-indent:\s*calc\([^;]*\+[^;]*\)/.test(flush)).toBe(false);
		});
	});

	// =========================================================================
	// Inter-row gap lever (--tree-list-row-gap) + guide spanning
	// =========================================================================

	describe('row gap lever', () => {
		it('defaults the row gap to a subtle 2px separation', async () => {
			// The lever is published on the tree-list root; its default is
			// --spacing-0-5 (2px) so rows have a light separation out of the box. A
			// theme can widen or close it via the tree-list target.
			//
			// Upstream reads the value back with `getComputedStyle`, which in jsdom
			// hands the declared string straight back. A real Chromium substitutes
			// `var()` at computed-value time, and `setup-stylex.ts` deliberately does
			// NOT install the theme tokens, so `--spacing-0-5` is undefined and the
			// property computes to the empty string. The declaration on the root's own
			// compiled rule is therefore what is asserted — the same fact, read where
			// this browser keeps it.
			const screen = await render(TreeListFixture, {
				props: { items: simpleItems, tree: { 'data-testid': 'tree' } }
			});
			const root = screen.container.querySelector('[data-testid="tree"]') as HTMLElement;
			expect(hasDeclarationFor(root, /--tree-list-row-gap:\s*var\(--spacing-0-5\)/)).toBe(true);
		});

		it('lets a theme open a row gap via the tree-list target', () => {
			// The @layer cascade is not observable from JS, so the generated CSS is
			// what proves the override reaches the lever.
			const theme = defineTheme({
				name: 'tree-list-row-gap-test',
				components: {
					'tree-list': {
						base: { '--tree-list-row-gap': 'var(--spacing-1)' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-tree-list {');
			expect(css).toContain('--tree-list-row-gap: var(--spacing-1)');
		});

		it('the guide of a row with a sibling below spans into it (verticalFull)', async () => {
			// A row that is NOT last in its group bridges the 1px hairline into the
			// next contiguous sibling so the connector reads as one continuous line.
			// Assert the APPLIED class on that row's own connector — not a global
			// stylesheet regex — so the isLast ? verticalLast : verticalFull branch is
			// actually exercised (Child 1 has Child 2 below it). The debug class name
			// ports unchanged: our style keys carry upstream's names verbatim and only
			// the module prefix differs, which a `toContain` does not see.
			const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
			const child1 = rowOf(screen.container, 'Child 1');
			const guide = child1.firstElementChild?.querySelector('.astryx-tree-list-guide');
			expect(guide).not.toBeNull();
			expect(guide?.className).toContain('verticalFull');
			expect(guide?.className).not.toContain('verticalLast');
		});

		it('clamps the last-in-group guide so it does not overhang the gap (verticalLast)', async () => {
			// The last row in a group has nothing below it, so its connector must NOT
			// run through the row wrapper's bottom padding into empty space — it uses
			// verticalLast, which subtracts half the row gap. Assert the applied class
			// on the last child's own connector (Child 2 is last in its group), so a
			// reverted branch is caught.
			const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
			const child2 = rowOf(screen.container, 'Child 2');
			const guide = child2.firstElementChild?.querySelector('.astryx-tree-list-guide');
			expect(guide).not.toBeNull();
			expect(guide?.className).toContain('verticalLast');
			expect(guide?.className).not.toContain('verticalFull');
		});

		it('carries the inter-row gap as collapse-proof padding on the row wrapper, not the paint target', async () => {
			// Finding from upstream's review: the gap must be `padding-block` (which
			// cannot collapse) on the row WRAPPER, not `margin-block` on the row box —
			// a margin there collapses through the position:relative wrapper and the
			// <li>, delivering only half the configured gap. It also must not sit on
			// `tree-list-item`, which is a paint seam: layout longhands do not belong
			// on a paintable target.
			const screen = await render(TreeListFixture, { props: { items: simpleItems } });
			const item = screen.container.querySelector<HTMLElement>('.astryx-tree-list-item');
			expect(item).not.toBeNull();
			const rowWrapper = item?.parentElement as HTMLElement;

			const rules = injectedCss();
			// Map the rowWrapper's compiled class to its declaration block and assert
			// it declares padding-block from the row-gap lever (half above/below).
			expect(Array.from(rowWrapper.classList).find((c) => c.includes('rowWrapper'))).toBeDefined();
			expect(rules).toMatch(
				/padding-block:\s*calc\(\s*var\(--tree-list-row-gap[^)]*\)\s*\/\s*2\s*\)/
			);
			// And the paint target (tree-list-item / contentWrapper) must NOT carry a
			// margin-block gap — the layout seam has moved off the paintable element.
			expect(
				Array.from(item?.classList ?? []).find((c) => c.includes('contentWrapper'))
			).toBeDefined();
			expect(rules).not.toMatch(/margin-block:\s*calc\([^;]*var\(--tree-list-row-gap/);
		});
	});

	// =========================================================================
	// astryx class name
	// =========================================================================

	it('applies astryx-tree-list class name', async () => {
		const screen = await render(TreeListFixture, {
			props: { items: simpleItems, tree: { 'data-testid': 'tree' } }
		});
		const root = screen.container.querySelector('[data-testid="tree"]')!;
		expect(root.className).toContain('astryx-tree-list');
	});

	// =========================================================================
	// Chevron theme target
	// =========================================================================

	describe('chevron theme target', () => {
		it('renders the astryx-tree-list-chevron target on the toggle button', async () => {
			const screen = await render(TreeListFixture, { props: { items: nestedItems } });
			const toggle = rowOf(screen.container, 'Parent').querySelector('[data-tree-toggle]')!;

			// Dedicated, stable theme target on the expand/collapse control, so a
			// theme can restyle the chevron without a fragile [data-tree-toggle] hook.
			expect(toggle).toHaveClass('astryx-tree-list-chevron');
			// Open/closed state is reflected so a theme can target each state alone.
			expect(toggle).toHaveAttribute('data-state', 'collapsed');
		});

		it('reflects the expanded state on the toggle when open', async () => {
			const screen = await render(TreeListFixture, { props: { items: nestedItemsExpanded } });
			const toggle = rowOf(screen.container, 'Parent').querySelector('[data-tree-toggle]')!;

			expect(toggle).toHaveClass('astryx-tree-list-chevron');
			expect(toggle).toHaveAttribute('data-state', 'expanded');
		});

		it('keeps the functional data-tree-toggle hook alongside the new target', async () => {
			// The theme target is additive — the toggle is still a real <button> and
			// still carries the functional activation attribute TreeList relies on.
			const screen = await render(TreeListFixture, { props: { items: nestedItems } });
			const toggle = rowOf(screen.container, 'Parent').querySelector('[data-tree-toggle]')!;
			expect(toggle.tagName).toBe('BUTTON');
			expect(toggle).toHaveAttribute('data-tree-toggle');
		});

		it('exposes tree-list-chevron as a themeable defineTheme target', () => {
			// The generated CSS is what proves the target is reachable by a theme:
			// the @layer cascade is not observable from JS, so the DOM-class
			// assertions above and this generation assertion together cover the seam.
			const theme = defineTheme({
				name: 'tree-list-chevron-test',
				components: {
					'tree-list-chevron': {
						base: { color: 'var(--color-accent)' },
						'state:expanded': { color: 'var(--color-text-primary)' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-tree-list-chevron {');
			expect(css).toContain('color: var(--color-accent)');
			expect(css).toContain('.astryx-tree-list-chevron.expanded');
			expect(css).toContain('color: var(--color-text-primary)');
		});
	});

	// =========================================================================
	// Item label theme target
	// =========================================================================

	describe('item label theme target', () => {
		it('renders the astryx-tree-list-item-label target on the label span', async () => {
			const screen = await render(TreeListFixture, { props: { items: simpleItems } });
			const label = labelOf(screen.container, 'Item A');

			// Dedicated, stable theme target on the label text, so a theme can style
			// just the label without a fragile `button:not([data-tree-toggle]) > span`
			// structural selector.
			expect(label).toHaveClass('astryx-tree-list-item-label');
			// A non-selected item's label carries no selected reflection.
			expect(label).not.toHaveAttribute('data-selected');
		});

		it('reflects the selected state on the selected item label', async () => {
			const screen = await render(TreeListFixture, {
				props: { items: [{ id: 'a', label: 'Item A', isSelected: true }] }
			});
			const label = labelOf(screen.container, 'Item A');
			expect(label).toHaveClass('astryx-tree-list-item-label');
			expect(label).toHaveAttribute('data-selected', 'selected');
		});

		it('keeps the label linked to its row via aria-labelledby', async () => {
			// The theme target is additive — the label still owns the id the
			// interactive row references for its accessible name.
			const screen = await render(TreeListFixture, {
				props: { items: [{ id: 'a', label: 'Item A', onClick: () => {} }] }
			});
			const label = labelOf(screen.container, 'Item A');
			const action = screen.container.querySelector('button')!;
			expect(action).toHaveAttribute('aria-labelledby', label.id);
		});

		it('exposes tree-list-item-label as a themeable defineTheme target', () => {
			// The generated CSS is what proves the target is reachable by a theme:
			// the @layer cascade is not observable from JS, so the DOM-class
			// assertions above and this generation assertion together cover the seam.
			const theme = defineTheme({
				name: 'tree-list-item-label-test',
				components: {
					'tree-list-item-label': {
						base: { color: 'var(--color-text-primary)' },
						selected: { fontWeight: 'var(--font-weight-bold)' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-tree-list-item-label {');
			expect(css).toContain('color: var(--color-text-primary)');
			expect(css).toContain('.astryx-tree-list-item-label.selected');
			expect(css).toContain('font-weight: var(--font-weight-bold)');
		});
	});

	// =========================================================================
	// APG structural ARIA (aria-level / aria-posinset / aria-setsize)
	// =========================================================================

	it('sets aria-level, aria-posinset, and aria-setsize at the top level', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		const apple = rowOf(screen.container, 'Apple');
		expect(apple).toHaveAttribute('aria-level', '1');
		expect(apple).toHaveAttribute('aria-posinset', '1');
		expect(apple).toHaveAttribute('aria-setsize', '3');

		const cherry = rowOf(screen.container, 'Cherry');
		expect(cherry).toHaveAttribute('aria-posinset', '3');
		expect(cherry).toHaveAttribute('aria-setsize', '3');
	});

	it('sets aria-level/posinset/setsize correctly at deeper levels', async () => {
		const screen = await render(TreeListFixture, { props: { items: expandedParentItems } });
		const parent = rowOf(screen.container, 'Parent');
		expect(parent).toHaveAttribute('aria-level', '1');
		expect(parent).toHaveAttribute('aria-setsize', '2');

		const child1 = rowOf(screen.container, 'Child 1');
		expect(child1).toHaveAttribute('aria-level', '2');
		expect(child1).toHaveAttribute('aria-posinset', '1');
		expect(child1).toHaveAttribute('aria-setsize', '2');

		const child2 = rowOf(screen.container, 'Child 2');
		expect(child2).toHaveAttribute('aria-level', '2');
		expect(child2).toHaveAttribute('aria-posinset', '2');
	});

	it('sets aria-level across three depths', async () => {
		const screen = await render(TreeListFixture, { props: { items: deepItems } });
		expect(rowOf(screen.container, 'Root')).toHaveAttribute('aria-level', '1');
		expect(rowOf(screen.container, 'Mid')).toHaveAttribute('aria-level', '2');
		expect(rowOf(screen.container, 'Leaf')).toHaveAttribute('aria-level', '3');
	});

	// =========================================================================
	// Roving tabindex
	// =========================================================================

	it('makes exactly one treeitem tabbable by default (the first enabled)', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		const treeitems = Array.from(
			screen.container.querySelectorAll<HTMLElement>('[role="treeitem"]')
		);
		const tabbable = treeitems.filter((el) => el.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
		expect(tabbable[0]).toBe(rowOf(screen.container, 'Apple'));
		expect(rowOf(screen.container, 'Banana')).toHaveAttribute('tabindex', '-1');
	});

	it('defaults the tab stop to the selected item when one is selected', async () => {
		const items: TreeListFixtureItem[] = [
			{ id: 'a', label: 'Apple' },
			{ id: 'b', label: 'Banana', isSelected: true },
			{ id: 'c', label: 'Cherry' }
		];
		const screen = await render(TreeListFixture, { props: { items } });
		expect(rowOf(screen.container, 'Banana')).toHaveAttribute('tabindex', '0');
		expect(rowOf(screen.container, 'Apple')).toHaveAttribute('tabindex', '-1');
	});

	it('moves the single tab stop when focus moves via keyboard', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		rowOf(screen.container, 'Apple').focus();
		await userEvent.keyboard('{ArrowDown}');
		const treeitems = Array.from(
			screen.container.querySelectorAll<HTMLElement>('[role="treeitem"]')
		);
		const tabbable = treeitems.filter((el) => el.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
		expect(tabbable[0]).toBe(rowOf(screen.container, 'Banana'));
	});

	// =========================================================================
	// APG keyboard navigation
	// =========================================================================

	it('ArrowDown / ArrowUp move focus between visible treeitems', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		rowOf(screen.container, 'Apple').focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Banana'));
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Cherry'));
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Banana'));
	});

	it('ArrowDown / ArrowUp skip disabled treeitems', async () => {
		const screen = await render(TreeListFixture, { props: { items: withDisabledItems } });
		rowOf(screen.container, 'Apple').focus();
		await userEvent.keyboard('{ArrowDown}');
		// Banana is disabled → skipped, lands on Cherry.
		expect(document.activeElement).toBe(rowOf(screen.container, 'Cherry'));
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Apple'));
	});

	it('ArrowRight expands a collapsed parent, then enters the first child', async () => {
		const screen = await render(TreeListFixture, { props: { items: collapsedParentItems } });
		const parent = rowOf(screen.container, 'Parent');
		parent.focus();
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
		await userEvent.keyboard('{ArrowRight}');
		// First ArrowRight expands.
		expect(labelExists(screen.container, 'Child 1')).toBe(true);
		expect(document.activeElement).toBe(parent);
		await userEvent.keyboard('{ArrowRight}');
		// Second ArrowRight moves into first child.
		expect(document.activeElement).toBe(rowOf(screen.container, 'Child 1'));
	});

	it('ArrowRight on a leaf is a no-op', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		const apple = rowOf(screen.container, 'Apple');
		apple.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(apple);
	});

	it('ArrowLeft collapses an expanded parent, then moves to parent', async () => {
		const screen = await render(TreeListFixture, { props: { items: expandedParentItems } });
		const parent = rowOf(screen.container, 'Parent');
		rowOf(screen.container, 'Child 1').focus();
		await userEvent.keyboard('{ArrowLeft}');
		// Child is a leaf → ArrowLeft moves to parent.
		expect(document.activeElement).toBe(parent);
		await userEvent.keyboard('{ArrowLeft}');
		// Parent is expanded → ArrowLeft collapses it.
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
	});

	it('Home and End move to the first and last visible treeitems', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		rowOf(screen.container, 'Banana').focus();
		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Cherry'));
		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Apple'));
	});

	it('Enter activates the item onClick', async () => {
		const onClick = vi.fn();
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Apple', onClick }];
		const screen = await render(TreeListFixture, { props: { items } });
		rowOf(screen.container, 'Apple').focus();
		await userEvent.keyboard('{Enter}');
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('Space activates the item onClick', async () => {
		const onClick = vi.fn();
		const items: TreeListFixtureItem[] = [{ id: 'a', label: 'Apple', onClick }];
		const screen = await render(TreeListFixture, { props: { items } });
		rowOf(screen.container, 'Apple').focus();
		await userEvent.keyboard(' ');
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('Enter toggles expansion for a parent without its own action', async () => {
		const screen = await render(TreeListFixture, { props: { items: collapsedParentItems } });
		rowOf(screen.container, 'Parent').focus();
		expect(labelExists(screen.container, 'Child 1')).toBe(false);
		await userEvent.keyboard('{Enter}');
		expect(labelExists(screen.container, 'Child 1')).toBe(true);
	});

	it('typeahead moves focus to the next item matching typed characters', async () => {
		const screen = await render(TreeListFixture, { props: { items: flatItems } });
		rowOf(screen.container, 'Apple').focus();
		await userEvent.keyboard('c');
		expect(document.activeElement).toBe(rowOf(screen.container, 'Cherry'));
	});
});
