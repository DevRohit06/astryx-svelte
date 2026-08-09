import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Tree, { type TreeNode } from './fixtures/tree-focus-fixture.svelte';

/**
 * Ported from Astryx's `hooks/useTreeFocus.test.tsx` — **13 upstream cases at
 * v0.3.0 (4 linear, 3 Arrow Left/Right, 3 RTL, 3 activation + typeahead), 13
 * here, none dropped**. (The previous header said "all nine cases"; upstream had
 * ten even then, and 0.3.0 added the three RTL cases. The count was wrong, not
 * the coverage.)
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
});
