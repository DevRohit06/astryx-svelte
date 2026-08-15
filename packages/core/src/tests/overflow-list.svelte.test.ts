import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import Fixture from './fixtures/overflow-list-fixture.svelte';
import type { OverflowItemData } from './fixtures/overflow-list-fixture.svelte';

/**
 * Ported from Astryx's `OverflowList/OverflowList.test.tsx`, all nineteen `it`
 * cases bar the `displayName` one — eighteen here. (Counting the `describe`s in
 * would give a bigger number; the ledger is the `it` count.) The four
 * `maxVisibleItems`/`maxRows` cases arrived with 0.1.9's bounded multi-row
 * wrapping.
 *
 * ## Why the client (Chromium) project, with upstream's exact monkeypatch
 *
 * Upstream runs in jsdom, which reports every element as 0px wide and has no
 * `ResizeObserver`, so it drives the fit algorithm deterministically: a
 * `data-w` attribute read by a mocked `offsetWidth`, and a no-op `ResizeObserver`
 * whose initial callback the algorithm fires itself. The visible container's
 * available width is the `data-w` passed straight through to it.
 *
 * That harness needs a live DOM where the component actually mounts, runs its
 * attachments, observes resize and slices its items — none of which the `server`
 * project can do: it is `environment: 'node'` with no DOM, and `svelte/server`
 * renders a string without effects. So this is a `*.svelte.test.ts` and runs in
 * real Chromium — and there we install *upstream's* override verbatim:
 * `HTMLElement.prototype.offsetWidth` reads `data-w` (or the wrapped indicator's
 * child's `data-w`), which intercepts the real getter so the fixed-width math
 * holds exactly as it does upstream, rather than measuring real glyph widths.
 * `overflow.svelte.test.ts` (the hook suite) already proves stubbing
 * `ResizeObserver` works in this project; here the DOM override joins it.
 *
 * ## Two cases without a straight translation
 *
 * - **`forwards a ref to the visible container`** is a *counterpart*: Svelte has
 *   no ref callback, so a consumer reaches the root through an attachment passed
 *   in the rest props — the same move `button-group`/`thumbnail` use. It checks
 *   more than upstream's, since it receives the element rather than only proving
 *   a callback ran.
 * - **`exposes a displayName for devtools` is dropped.** Svelte components have
 *   no `displayName` surface. Recorded, with the rest of the port's `displayName`
 *   drops, in port/todo.md.
 *
 * The API shape differs from upstream (`items` + snippets, not compositional
 * children) — see the component's port note; every upstream child becomes an
 * entry in the fixture's `items` and the assertions are upstream's verbatim.
 */

const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

beforeAll(() => {
	// Upstream's override, verbatim: each item declares its pixel width via
	// `data-w`; the overflow indicator is wrapped in a measurement <div>, so read
	// the width off its child. In real Chromium this intercepts the native getter
	// so the fixed-width algorithm runs deterministically.
	Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
		configurable: true,
		get(this: HTMLElement): number {
			const own = this.getAttribute('data-w');
			if (own != null) {
				return Number(own);
			}
			const child = this.firstElementChild;
			if (child) {
				return Number(child.getAttribute('data-w') ?? 0);
			}
			return 0;
		}
	});
	// No-op ResizeObserver — the shared observer fires its initial callback
	// synchronously on observe(), so the algorithm still measures on mount.
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe(): void {}
			unobserve(): void {}
			disconnect(): void {}
		}
	);
});

afterAll(() => {
	if (originalOffsetWidth) {
		Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
	}
	vi.unstubAllGlobals();
});

const THREE: OverflowItemData[] = [
	{ w: 40, label: 'A' },
	{ w: 40, label: 'B' },
	{ w: 40, label: 'C' }
];

const FOUR: OverflowItemData[] = [...THREE, { w: 40, label: 'D' }];

/** The visible (non-measurement) container, identified by its testid. */
function visibleContainer(scope: Element): HTMLElement {
	return scope.querySelector('[data-testid="ov"]') as HTMLElement;
}

/** The hidden measurement container (the only inert element rendered). */
function measureContainer(scope: Element): HTMLElement {
	return scope.querySelector('[inert]') as HTMLElement;
}

/** Upstream's `within(el).queryByText` — the leaf element whose text matches. */
function queryByText(scope: Element, matcher: string | RegExp): Element | null {
	const match = (t: string) => (typeof matcher === 'string' ? t === matcher : matcher.test(t));
	return (
		[...scope.querySelectorAll('*')].find(
			(el) => el.children.length === 0 && match((el.textContent ?? '').trim())
		) ?? null
	);
}

describe('OverflowList', () => {
	describe('when all items fit', () => {
		it('renders every item and no overflow indicator', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '1000',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).toBeInTheDocument();
			expect(queryByText(vis, 'C')).toBeInTheDocument();
			// No overflow indicator when nothing is hidden.
			expect(queryByText(vis, /^more:/)).not.toBeInTheDocument();
		});
	});

	describe('when items overflow (collapseFrom="end", default)', () => {
		it('hides trailing items and shows an indicator for them', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '100',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			// 100px fits one 40px item once 40px is reserved for the indicator.
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).not.toBeInTheDocument();
			expect(queryByText(vis, 'C')).not.toBeInTheDocument();
			// Indicator lists the hidden items by their original index (1 and 2).
			expect(queryByText(vis, 'more:1,2')).toBeInTheDocument();
		});

		it('fits more items as the available width grows', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '110',
					'data-testid': 'ov',
					withIndicator: true,
					indicatorWidth: 20,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			// 110px fits two 40px items plus the 20px indicator reservation (100px),
			// but not a third (120px) — so C collapses.
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).toBeInTheDocument();
			expect(queryByText(vis, 'C')).not.toBeInTheDocument();
			expect(queryByText(vis, 'more:2')).toBeInTheDocument();
		});

		it('places the indicator after the visible items', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '100',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			// Restated: Svelte renders {#if}/{#each} as anchor comments and keeps a
			// whitespace text node between the blocks; those are `display:none` in
			// the flex container and carry no visible effect. Upstream pins ordering
			// with an exact `textContent`, so we assert the same order on the
			// whitespace-stripped text.
			expect(vis.textContent?.replace(/\s+/g, '')).toBe('Amore:1,2');
		});
	});

	describe('when items overflow (collapseFrom="start")', () => {
		it('hides leading items and renders the indicator first', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					collapseFrom: 'start',
					'data-w': '100',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			// The trailing item stays; the leading two collapse.
			expect(queryByText(vis, 'C')).toBeInTheDocument();
			expect(queryByText(vis, 'A')).not.toBeInTheDocument();
			expect(queryByText(vis, 'B')).not.toBeInTheDocument();
			// Indicator carries the hidden indices 0 and 1, and comes first.
			expect(queryByText(vis, 'more:0,1')).toBeInTheDocument();
			// Restated for the same reason as `places the indicator after the
			// visible items`: Svelte's block anchors add whitespace text nodes that
			// carry no visual effect, so ordering is asserted whitespace-stripped.
			expect(vis.textContent?.replace(/\s+/g, '')).toBe('more:0,1C');
		});
	});

	describe('minVisibleItems', () => {
		it('keeps at least the requested number of items visible', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					minVisibleItems: 2,
					'data-w': '100',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			// Without the floor only one item would fit; the floor forces two.
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).toBeInTheDocument();
			expect(queryByText(vis, 'C')).not.toBeInTheDocument();
			expect(queryByText(vis, 'more:2')).toBeInTheDocument();
		});
	});

	describe('without an overflow renderer', () => {
		it('drops overflowing items but renders no indicator', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '100',
					'data-testid': 'ov',
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			// With no indicator to reserve space for, two 40px items fit in 100px.
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).toBeInTheDocument();
			expect(queryByText(vis, 'C')).not.toBeInTheDocument();
		});
	});

	describe('measurement container', () => {
		it('renders a hidden, inert measurement copy of all children', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '100',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const measure = measureContainer(screen.container);
			expect(measure).toHaveAttribute('aria-hidden', 'true');
			expect(measure).toHaveAttribute('inert');
			// Measures against every item, even the ones hidden from the visible row.
			expect(queryByText(measure, 'A')).toBeInTheDocument();
			expect(queryByText(measure, 'B')).toBeInTheDocument();
			expect(queryByText(measure, 'C')).toBeInTheDocument();
		});

		it('measures the indicator against all items (max width)', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '100',
					'data-testid': 'ov',
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			// The measurement indicator reflects every index (0,1,2), reserving the
			// widest possible indicator; the visible one only lists hidden indices.
			const measure = measureContainer(screen.container);
			expect(queryByText(measure, 'more:0,1,2')).toBeInTheDocument();
		});
	});

	describe('rendering contract', () => {
		it('renders the stable astryx-overflow-list class on the visible container', async () => {
			const screen = await render(Fixture, {
				props: {
					'data-w': '1000',
					'data-testid': 'ov',
					items: [{ w: 10, label: 'A' }]
				}
			});
			await tick();
			expect(visibleContainer(screen.container)).toHaveClass('astryx-overflow-list');
		});

		// Counterpart to upstream's `forwards a ref to the visible container`; see
		// the file header. An attachment through the rest props is how a consumer
		// reaches the root here, and it receives the element rather than only
		// proving a callback ran.
		it('hands the visible container to an attachment passed through rest props', async () => {
			const attached = vi.fn();
			const screen = await render(Fixture, {
				props: {
					'data-w': '1000',
					'data-testid': 'ov',
					items: [{ w: 10, label: 'A' }],
					[createAttachmentKey()]: attached
				}
			});
			await tick();
			expect(attached).toHaveBeenCalledOnce();
			const el = attached.mock.calls[0][0] as HTMLElement;
			expect(el).toBe(visibleContainer(screen.container));
			expect(el).toHaveClass('astryx-overflow-list');
		});

		it('applies a different gap class as the gap prop changes', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '1000',
					'data-testid': 'ov',
					items: [{ w: 10, label: 'A' }]
				}
			});
			await tick();
			const gap0 = visibleContainer(screen.container).getAttribute('class');

			await screen.rerender({
				gap: 4,
				'data-w': '1000',
				'data-testid': 'ov',
				items: [{ w: 10, label: 'A' }]
			});
			await tick();
			const gap4 = visibleContainer(screen.container).getAttribute('class');
			expect(gap4).not.toEqual(gap0);
		});

		it('renders nothing extra for an empty child list', async () => {
			const screen = await render(Fixture, {
				props: {
					'data-w': '1000',
					'data-testid': 'ov',
					withIndicator: true,
					items: []
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			expect(vis).toBeInTheDocument();
			// Restated: upstream asserts `toBeEmptyDOMElement`, but Svelte leaves the
			// {#if}/{#each} anchor comments and a little whitespace in the container.
			// The equivalent claim — "renders nothing extra" — is that no element
			// (no item, no indicator) and no visible text was rendered.
			expect(vis.querySelector('*')).toBeNull();
			expect(vis.textContent?.trim()).toBe('');
		});

		it('passes arbitrary DOM props through to the visible container', async () => {
			const screen = await render(Fixture, {
				props: {
					'data-w': '1000',
					'data-testid': 'ov',
					'aria-label': 'Toolbar actions',
					items: [{ w: 10, label: 'A' }]
				}
			});
			await tick();
			expect(visibleContainer(screen.container)).toHaveAttribute('aria-label', 'Toolbar actions');
		});

		// Dropped: upstream's `exposes a displayName for devtools`. Svelte
		// components have no `displayName` surface; recorded in port/todo.md.
	});

	describe('maxVisibleItems (cap)', () => {
		it('caps visible items even when they all fit', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '1000',
					'data-testid': 'ov',
					maxVisibleItems: 2,
					withIndicator: true,
					items: FOUR
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).toBeInTheDocument();
			expect(queryByText(vis, 'C')).not.toBeInTheDocument();
			expect(queryByText(vis, 'more:2,3')).toBeInTheDocument();
		});

		it('min wins over a smaller cap (D1)', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '1000',
					'data-testid': 'ov',
					minVisibleItems: 3,
					maxVisibleItems: 1,
					withIndicator: true,
					items: FOUR
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).toBeInTheDocument();
			expect(queryByText(vis, 'C')).toBeInTheDocument();
			expect(queryByText(vis, 'D')).not.toBeInTheDocument();
			expect(warn).toHaveBeenCalled();
			warn.mockRestore();
		});
	});

	describe('maxRows (multi-row)', () => {
		it('applies a different container class when maxRows enables wrapping', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '1000',
					'data-testid': 'ov',
					items: [{ w: 40, label: 'A' }]
				}
			});
			await tick();
			const singleLine = visibleContainer(screen.container).getAttribute('class');

			await screen.rerender({
				gap: 0,
				'data-w': '1000',
				'data-testid': 'ov',
				maxRows: 2,
				items: [{ w: 40, label: 'A' }]
			});
			await tick();
			const multiRow = visibleContainer(screen.container).getAttribute('class');
			expect(multiRow).not.toEqual(singleLine);
		});

		it('keeps single-line behavior with maxRows={1}', async () => {
			const screen = await render(Fixture, {
				props: {
					gap: 0,
					'data-w': '100',
					'data-testid': 'ov',
					maxRows: 1,
					withIndicator: true,
					items: THREE
				}
			});
			await tick();
			const vis = visibleContainer(screen.container);
			expect(queryByText(vis, 'A')).toBeInTheDocument();
			expect(queryByText(vis, 'B')).not.toBeInTheDocument();
		});
	});
});
