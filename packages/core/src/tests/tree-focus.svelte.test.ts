import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Tree, { type TreeNode } from './fixtures/tree-focus-fixture.svelte';

/**
 * Ported from Astryx's `hooks/useTreeFocus.test.tsx` — **16 upstream cases at
 * the 0.5.0 pin (4 linear, 3 Arrow Left/Right, 3 RTL, 6 activation + typeahead), 16
 * here, none dropped**. (Re-derived at the 0.5.0 pin; upstream's file has not
 * moved since v0.4.1.) (The header has been wrong twice: it once said "all nine
 * cases" when upstream had ten, then "13 at v0.3.0" — correct at the time.
 * v0.4.1 adds the three typeahead cases that pin the two #4844 fixes the hook's
 * private typeahead just took: a repeated letter *cycles* instead of extending
 * the query to "aa", and the `+1` offset that skips the current item applies
 * only to a single-character query, so a multi-character query can still match
 * the item it is refining.)
 *
 * Runs in the **client** project and cannot leave it: the hook reads
 * `document.activeElement`, moves focus with `.focus()`, resolves visible
 * treeitems with `querySelectorAll`, detects direction through
 * `getComputedStyle` (`isRtlElement`) and repairs its roving tab stop with a
 * `MutationObserver`. None of that exists under `svelte/server`.
 *
 * The one translation is timing. Upstream's `fireEvent` + React state update is
 * synchronous, so it presses ArrowRight twice in a row to expand a parent and
 * then descend into the child it just revealed. A `$state` write here flushes on
 * a microtask, so the second press waits on a retrying `expect.element` —
 * otherwise it would run against the un-expanded DOM and find no child to move
 * to. The RTL block needs it in the same two places, for the same reason.
 *
 * The RTL block stamps `dir="rtl"` on the tree container; the hook reads the
 * *computed* direction via `isRtlElement`, lazily and only for the two
 * horizontal arrows, so these cases exercise the detection path rather than an
 * option.
 */

function keyDown(element: Element, init: KeyboardEventInit): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
}

const FLAT: TreeNode[] = [
	{ id: 'a', label: 'Apple', level: 1 },
	{ id: 'b', label: 'Banana', level: 1 },
	{ id: 'c', label: 'Cherry', level: 1 }
];

describe('useTreeFocus linear navigation', () => {
	it('ArrowDown / ArrowUp move between visible treeitems', async () => {
		const screen = await render(Tree, { props: { collapsed: FLAT } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('a').element().focus();

		keyDown(tree, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('b')).toHaveFocus();
		keyDown(tree, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('c')).toHaveFocus();
		keyDown(tree, { key: 'ArrowUp' });
		await expect.element(screen.getByTestId('b')).toHaveFocus();
	});

	it('ArrowDown / ArrowUp skip disabled treeitems', async () => {
		const nodes: TreeNode[] = [
			{ id: 'a', label: 'Apple', level: 1 },
			{ id: 'b', label: 'Banana', level: 1, disabled: true },
			{ id: 'c', label: 'Cherry', level: 1 }
		];
		const screen = await render(Tree, { props: { collapsed: nodes } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('a').element().focus();

		keyDown(tree, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('c')).toHaveFocus();
		keyDown(tree, { key: 'ArrowUp' });
		await expect.element(screen.getByTestId('a')).toHaveFocus();
	});

	it('Home / End move to the first and last visible treeitems', async () => {
		const screen = await render(Tree, { props: { collapsed: FLAT } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('b').element().focus();

		keyDown(tree, { key: 'End' });
		await expect.element(screen.getByTestId('c')).toHaveFocus();
		keyDown(tree, { key: 'Home' });
		await expect.element(screen.getByTestId('a')).toHaveFocus();
	});

	it('ArrowDown does not wrap past the last item', async () => {
		const screen = await render(Tree, { props: { collapsed: FLAT } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('c').element().focus();
		keyDown(tree, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('c')).toHaveFocus();
	});
});

describe('useTreeFocus tree semantics (Arrow Left/Right)', () => {
	const COLLAPSED: TreeNode[] = [{ id: 'p', label: 'Parent', level: 1, expanded: false }];
	const EXPANDED: TreeNode[] = [
		{ id: 'p', label: 'Parent', level: 1, expanded: true },
		{ id: 'c1', label: 'Child 1', level: 2 },
		{ id: 'c2', label: 'Child 2', level: 2 }
	];

	it('ArrowRight expands a collapsed parent, then enters the first child', async () => {
		const screen = await render(Tree, { props: { collapsed: COLLAPSED, expanded: EXPANDED } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('p').element().focus();

		await expect.element(screen.getByTestId('c1')).not.toBeInTheDocument();
		keyDown(tree, { key: 'ArrowRight' });
		// Expanded now.
		await expect.element(screen.getByTestId('c1')).toBeInTheDocument();
		// Focus stayed on parent.
		await expect.element(screen.getByTestId('p')).toHaveFocus();

		keyDown(tree, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('c1')).toHaveFocus();
	});

	it('ArrowRight on a leaf is a no-op', async () => {
		const screen = await render(Tree, { props: { collapsed: FLAT } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('a').element().focus();
		keyDown(tree, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('a')).toHaveFocus();
	});

	it('ArrowLeft on a child moves to the parent; on an expanded parent collapses', async () => {
		const screen = await render(Tree, { props: { collapsed: COLLAPSED, expanded: EXPANDED } });
		const tree = screen.getByRole('tree').element();
		// Start expanded.
		screen.getByTestId('p').element().focus();
		keyDown(tree, { key: 'ArrowRight' }); // expand
		await expect.element(screen.getByTestId('c1')).toBeInTheDocument();
		keyDown(tree, { key: 'ArrowRight' }); // into child 1
		await expect.element(screen.getByTestId('c1')).toHaveFocus();

		keyDown(tree, { key: 'ArrowLeft' }); // child leaf → parent
		await expect.element(screen.getByTestId('p')).toHaveFocus();

		keyDown(tree, { key: 'ArrowLeft' }); // expanded parent → collapse
		await expect.element(screen.getByTestId('c1')).not.toBeInTheDocument();
	});
});

describe('useTreeFocus RTL tree semantics (WAI-ARIA Tree View)', () => {
	const COLLAPSED: TreeNode[] = [{ id: 'p', label: 'Parent', level: 1, expanded: false }];
	const EXPANDED: TreeNode[] = [
		{ id: 'p', label: 'Parent', level: 1, expanded: true },
		{ id: 'c1', label: 'Child 1', level: 2 },
		{ id: 'c2', label: 'Child 2', level: 2 }
	];

	it('auto-detects dir="rtl": ArrowLeft expands a collapsed parent, then enters the first child', async () => {
		const screen = await render(Tree, {
			props: { collapsed: COLLAPSED, expanded: EXPANDED, dir: 'rtl' }
		});
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('p').element().focus();

		await expect.element(screen.getByTestId('c1')).not.toBeInTheDocument();
		keyDown(tree, { key: 'ArrowLeft' }); // RTL: descend → expand
		await expect.element(screen.getByTestId('c1')).toBeInTheDocument();
		await expect.element(screen.getByTestId('p')).toHaveFocus();

		keyDown(tree, { key: 'ArrowLeft' }); // RTL: descend → into first child
		await expect.element(screen.getByTestId('c1')).toHaveFocus();
	});

	it('auto-detects dir="rtl": ArrowRight moves to parent, then collapses', async () => {
		const screen = await render(Tree, {
			props: { collapsed: COLLAPSED, expanded: EXPANDED, dir: 'rtl' }
		});
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('p').element().focus();
		keyDown(tree, { key: 'ArrowLeft' }); // expand
		await expect.element(screen.getByTestId('c1')).toBeInTheDocument();
		keyDown(tree, { key: 'ArrowLeft' }); // into child 1
		await expect.element(screen.getByTestId('c1')).toHaveFocus();

		keyDown(tree, { key: 'ArrowRight' }); // RTL: ascend → child leaf → parent
		await expect.element(screen.getByTestId('p')).toHaveFocus();

		keyDown(tree, { key: 'ArrowRight' }); // RTL: ascend → expanded parent → collapse
		await expect.element(screen.getByTestId('c1')).not.toBeInTheDocument();
	});

	it('vertical keys (ArrowDown/ArrowUp) are unaffected by RTL', async () => {
		const screen = await render(Tree, { props: { collapsed: FLAT, dir: 'rtl' } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('a').element().focus();
		keyDown(tree, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('b')).toHaveFocus();
		keyDown(tree, { key: 'ArrowUp' });
		await expect.element(screen.getByTestId('a')).toHaveFocus();
	});
});

describe('useTreeFocus activation + typeahead', () => {
	it('Enter/Space call onActivate for the focused item', async () => {
		const onActivate = vi.fn(() => true);
		const screen = await render(Tree, { props: { collapsed: FLAT, onActivate } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('a').element().focus();

		keyDown(tree, { key: 'Enter' });
		expect(onActivate).toHaveBeenCalledWith('a');

		keyDown(tree, { key: ' ' });
		expect(onActivate).toHaveBeenCalledTimes(2);
	});

	it('Enter toggles expansion when onActivate does not handle it', async () => {
		const COLLAPSED: TreeNode[] = [{ id: 'p', label: 'Parent', level: 1, expanded: false }];
		const EXPANDED: TreeNode[] = [
			{ id: 'p', label: 'Parent', level: 1, expanded: true },
			{ id: 'c1', label: 'Child 1', level: 2 }
		];
		const screen = await render(Tree, { props: { collapsed: COLLAPSED, expanded: EXPANDED } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('p').element().focus();
		await expect.element(screen.getByTestId('c1')).not.toBeInTheDocument();
		keyDown(tree, { key: 'Enter' });
		await expect.element(screen.getByTestId('c1')).toBeInTheDocument();
	});

	it('typeahead moves focus to the next item matching typed characters', async () => {
		const screen = await render(Tree, { props: { collapsed: FLAT } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('a').element().focus();
		keyDown(tree, { key: 'c' });
		await expect.element(screen.getByTestId('c')).toHaveFocus();
	});

	/*
	 * The three typeahead cases below assert with the plain, non-retrying
	 * `expect(element).toHaveFocus()` rather than the file's usual
	 * `await expect.element(...)`. Typeahead moves focus synchronously inside
	 * `focusItem`, so there is nothing to wait for — and an `await` between two
	 * presses is actively harmful here, because the hook's buffer resets after
	 * 500ms. A retry that took longer than that would restart the buffer and let
	 * both remaining cases pass for the wrong reason.
	 */

	it('typeahead cycles through same-letter matches on repeated presses', async () => {
		const nodes: TreeNode[] = [
			{ id: 'apple', label: 'Apple', level: 1 },
			{ id: 'apricot', label: 'Apricot', level: 1 },
			{ id: 'avocado', label: 'Avocado', level: 1 }
		];
		const screen = await render(Tree, { props: { collapsed: nodes } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('apple').element().focus();

		keyDown(tree, { key: 'a' });
		expect(screen.getByTestId('apricot').element()).toHaveFocus();

		// A repeat must cycle, not extend the query to "aa" (as useTypeahead does).
		keyDown(tree, { key: 'a' });
		expect(screen.getByTestId('avocado').element()).toHaveFocus();
	});

	it('typeahead searches from the top when no treeitem has focus', async () => {
		const nodes: TreeNode[] = [
			{ id: 'apple', label: 'Apple', level: 1 },
			{ id: 'banana', label: 'Banana', level: 1 },
			{ id: 'avocado', label: 'Avocado', level: 1 }
		];
		const screen = await render(Tree, { props: { collapsed: nodes } });
		const tree = screen.getByRole('tree').element();

		// No .focus() call: with no current item, the first match must win.
		keyDown(tree, { key: 'a' });
		expect(screen.getByTestId('apple').element()).toHaveFocus();
	});

	it('typeahead keeps focus on an item that still matches the refined buffer', async () => {
		const nodes: TreeNode[] = [
			{ id: 'apple', label: 'Apple', level: 1 },
			{ id: 'banana', label: 'Banana', level: 1 },
			{ id: 'apricot', label: 'Apricot', level: 1 }
		];
		const screen = await render(Tree, { props: { collapsed: nodes } });
		const tree = screen.getByRole('tree').element();
		screen.getByTestId('apple').element().focus();

		keyDown(tree, { key: 'a' });
		expect(screen.getByTestId('apricot').element()).toHaveFocus();

		// "ap" refines the search; Apricot still matches, so focus holds.
		keyDown(tree, { key: 'p' });
		expect(screen.getByTestId('apricot').element()).toHaveFocus();
	});
});
