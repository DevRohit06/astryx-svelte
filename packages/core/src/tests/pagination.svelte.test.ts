import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Pagination, { generatePageRange } from '$lib/components/pagination/pagination.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';

/**
 * Astryx's `Pagination/Pagination.test.tsx`, ported case for case — **93
 * upstream cases at the 0.5.0 pin** (9 in `describe('generatePageRange')` and
 * 84 in `describe('Pagination')` across its thirteen nested blocks, two of
 * which nest again inside `variant: input`), **92 here**. There is no
 * ref-callback and no `displayName` case in the file, so nothing is React-only.
 *
 * **The one that is not here** is `renders the prev/next caret icons without an
 * extra mirror wrapper span`, in `basic rendering`. It is not a standing drop —
 * it asserts on rendered DOM shape and transcribes unchanged. It landed
 * upstream between v0.3.0 and v0.4.1, so it has been missing across three pins;
 * this header read "92 upstream cases at 0.3.0 … 92 here, none dropped", which
 * was true only at 0.3.0 and hid the gap through both later re-pins. Upstream's
 * file is unchanged between v0.4.1 and 0.5.0.
 *
 * 0.3.0 added 28 of those: the prev/next hover-tooltip case in `basic
 * rendering`, the 19 of `variant: input` (11 direct, 6 in `first/last buttons`,
 * 2 in `pageLabel`) and the 8 of `step`.
 *
 * The nine `generatePageRange` cases are pure and would run in the node project,
 * but upstream keeps them in one file with the component cases and the count is
 * the contract, so they stay here — the browser runs a pure function just as
 * well. (`CodeBlock` split into three files only because upstream has three.)
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited; `rerender` is `screen.rerender`.
 * - `userEvent` comes from `vitest/browser`.
 * - `within(group).getAllByRole('button')` becomes a scoped `querySelectorAll`.
 * - `act()` has no counterpart: a `$state` write flushes on its own and
 *   `expect.element`/`vi.waitFor` retry. The two `changeAction` cases that wrap
 *   a click in `act` therefore just click.
 *
 * RESTATED cases carry an inline comment: the three that click a `disabled`
 * button (Playwright refuses to, which would assert its actionability heuristic
 * rather than the component) and the `interrupts an in-flight action` case,
 * whose two rapid clicks must be dispatched natively for the same reason the
 * `act()` wrapper existed upstream — to land both before either settles.
 */

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

function dotsGroup(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="group"][aria-label="Page indicators"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected the page-indicator group');
	return el;
}

function buttonsIn(el: HTMLElement): HTMLElement[] {
	return Array.from(el.querySelectorAll<HTMLElement>('button'));
}

/** A button by its accessible name (an `aria-label`, or its trimmed text). */
function buttonNamed(container: HTMLElement, name: string): HTMLElement | undefined {
	return buttonsIn(container).find(
		(b) => b.getAttribute('aria-label') === name || b.textContent?.trim() === name
	);
}

/**
 * Every tooltip layer rendered under `container`.
 *
 * Upstream reaches these with `getAllByRole('tooltip', {hidden: true})`; a
 * closed popover is really `display: none` in Chromium, and the locator API's
 * plural form returns one locator rather than a list, so the DOM query is the
 * direct equivalent. `Button` renders its layer as a *sibling* of the button,
 * so a container query finds them all.
 */
function tooltipsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="tooltip"]'));
}

/**
 * The `input` variant's editable page box.
 *
 * Queried by role rather than by `input[type="number"]`: 0.4.1 made
 * `NumberInput` a **text-backed spinbutton** — `type="text"` with
 * `role="spinbutton"` and `aria-valuemin`/`valuemax`/`valuenow`, which is what
 * lets `formatValue` show a thousands separator without the native control
 * rejecting it. So the box's value is a **string**, and its bounds are the
 * `aria-value*` attributes rather than `min`/`max`. Upstream's suite asserts the
 * same shape.
 */
function pageBox(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('[role="spinbutton"]');
	if (!(el instanceof HTMLInputElement)) throw new Error('expected the editable page box');
	return el;
}

/**
 * Upstream resets the live regions in `afterEach` only. Here that is not enough,
 * and the reason is hook ordering rather than anything about Pagination:
 * `vitest-browser-svelte` registers its unmount cleanup when it is imported, so
 * with vitest's default stack ordering it runs *after* this file's `afterEach`.
 *
 * The `variant: input` cases leave a typed value in the page box. Unmounting
 * blurs it, `NumberInput` commits the pending value on blur, and — because the
 * optimistic page has already reverted to the (uncontrolled) `page` prop by then
 * — the commit reads as a real navigation and announces. That announcement
 * recreates the singleton region milliseconds after the reset, and the next
 * test's `does not announce on initial mount` sees it.
 *
 * The behaviour is upstream's too (React's `useOptimistic` reverts identically);
 * only the cleanup order differs. So the reset is taken at both ends: the
 * `afterEach` stays for parity, and this `beforeEach` closes the window the
 * unmount opens. Fixing the ordering rather than loosening the assertion.
 */
beforeEach(() => {
	__resetLiveRegionsForTest();
});

afterEach(() => {
	__resetLiveRegionsForTest();
	vi.restoreAllMocks();
});

// =============================================================================
// generatePageRange helper
// =============================================================================

describe('generatePageRange', () => {
	it('returns all pages when total fits within slots', () => {
		expect(generatePageRange(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
	});

	it('returns all pages when total equals slot count', () => {
		// With siblingCount=1, totalSlots = 5 + 2*1 = 7
		expect(generatePageRange(4, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('shows right ellipsis when near start', () => {
		expect(generatePageRange(1, 10, 1)).toEqual([1, 2, 3, 4, 5, '...', 10]);
	});

	it('shows left ellipsis when near end', () => {
		expect(generatePageRange(10, 10, 1)).toEqual([1, '...', 6, 7, 8, 9, 10]);
	});

	it('shows both ellipses when in middle', () => {
		expect(generatePageRange(5, 10, 1)).toEqual([1, '...', 4, 5, 6, '...', 10]);
	});

	it('handles siblingCount=2', () => {
		expect(generatePageRange(6, 12, 2)).toEqual([1, '...', 4, 5, 6, 7, 8, '...', 12]);
	});

	it('handles siblingCount=0', () => {
		expect(generatePageRange(5, 10, 0)).toEqual([1, '...', 5, '...', 10]);
	});

	it('handles single page', () => {
		expect(generatePageRange(1, 1, 1)).toEqual([1]);
	});

	it('handles two pages', () => {
		expect(generatePageRange(1, 2, 1)).toEqual([1, 2]);
	});
});

// =============================================================================
// Pagination component
// =============================================================================

describe('Pagination', () => {
	describe('basic rendering', () => {
		it('renders nav landmark with default label', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 5 }
			});
			await expect
				.element(screen.getByRole('navigation', { name: 'Pagination' }))
				.toBeInTheDocument();
		});

		it('renders nav landmark with custom label', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 5, label: 'Results navigation' }
			});
			await expect
				.element(screen.getByRole('navigation', { name: 'Results navigation' }))
				.toBeInTheDocument();
		});

		it('renders prev and next buttons', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 5 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page' }))
				.toBeInTheDocument();
		});

		it('gives the prev/next carets a hover tooltip matching their accessible name', async () => {
			// The carets are icon-only, so sighted users need a visible label on
			// hover, not just the accessible name. The tooltip reuses the same
			// localized string, so it is reachable via aria-describedby.
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 5 }
			});
			const prev = screen.getByRole('button', { name: 'Go to previous page' }).element();
			const next = screen.getByRole('button', { name: 'Go to next page' }).element();
			const tooltipIds = new Set(tooltipsIn(screen.container).map((el) => el.id));
			expect(
				prev
					.getAttribute('aria-describedby')
					?.split(' ')
					.some((id) => tooltipIds.has(id))
			).toBe(true);
			expect(
				next
					.getAttribute('aria-describedby')
					?.split(' ')
					.some((id) => tooltipIds.has(id))
			).toBe(true);
		});

		it('renders with data-testid', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 5, 'data-testid': 'my-pagination' }
			});
			await expect.element(screen.getByTestId('my-pagination')).toBeInTheDocument();
		});

		it('returns null when totalItems is 0', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalItems: 0 }
			});
			expect(screen.container.querySelector('nav')).toBeNull();
		});

		it('returns null when totalPages is 0', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 0 }
			});
			expect(screen.container.querySelector('nav')).toBeNull();
		});
	});

	describe('variant: pages', () => {
		it('renders page number buttons', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 5 }
			});
			for (let i = 1; i <= 5; i++) {
				await expect
					.element(screen.getByRole('button', { name: `Go to page ${i}` }))
					.toBeInTheDocument();
			}
		});

		it('marks current page with aria-current', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 5 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 3' }))
				.toHaveAttribute('aria-current', 'page');
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 1' }))
				.not.toHaveAttribute('aria-current');
		});

		it('shows ellipsis for many pages', async () => {
			const screen = await render(Pagination, {
				props: { page: 5, onChange: () => {}, totalPages: 10 }
			});
			// Should show: 1 ... 4 5 6 ... 10
			for (const page of [1, 4, 5, 6, 10]) {
				expect(buttonNamed(screen.container, `Go to page ${page}`)).toBeInTheDocument();
			}
			// Pages 2, 3, 7, 8, 9 should not be shown
			expect(buttonNamed(screen.container, 'Go to page 2')).toBeUndefined();
			expect(buttonNamed(screen.container, 'Go to page 9')).toBeUndefined();
		});

		it('does not render pages when totalPages is unknown', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, hasMore: true }
			});
			// Should not show any page number buttons
			expect(
				buttonsIn(screen.container).some((b) =>
					/Go to page/.test(b.getAttribute('aria-label') ?? '')
				)
			).toBe(false);
		});
	});

	describe('variant: count', () => {
		it('renders count text', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					variant: 'count' as const
				}
			});
			await expect.element(screen.getByText(/1–10 of 100/)).toBeInTheDocument();
		});

		it('clamps range end to totalItems on last page', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 5,
					onChange: () => {},
					totalItems: 45,
					pageSize: 10,
					variant: 'count' as const
				}
			});
			await expect.element(screen.getByText(/41–45 of 45/)).toBeInTheDocument();
		});
	});

	describe('variant: compact', () => {
		it('renders compact text', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 10, variant: 'compact' as const }
			});
			await expect.element(screen.getByText('Page 3 of 10')).toBeInTheDocument();
		});
	});

	describe('pageSize guarding', () => {
		it('does not crash the dots variant when pageSize is 0', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 5,
					pageSize: 0,
					variant: 'dots' as const
				}
			});
			expect(buttonsIn(dotsGroup(screen.container))).toHaveLength(5);
		});

		it('treats NaN pageSize as the default', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 50,
					pageSize: NaN,
					variant: 'compact' as const
				}
			});
			await expect.element(screen.getByText('Page 1 of 5')).toBeInTheDocument();
		});

		it('clamps negative pageSize to 1', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 5,
					pageSize: -10,
					variant: 'compact' as const
				}
			});
			await expect.element(screen.getByText('Page 1 of 5')).toBeInTheDocument();
		});

		it('floors fractional pageSize', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 50,
					pageSize: 2.5,
					variant: 'compact' as const
				}
			});
			await expect.element(screen.getByText('Page 1 of 25')).toBeInTheDocument();
		});
	});

	describe('variant: dots', () => {
		it('renders dot indicators', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, totalPages: 5, variant: 'dots' as const }
			});
			expect(buttonsIn(dotsGroup(screen.container))).toHaveLength(5);
		});

		it('marks active dot with aria-current', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 5, variant: 'dots' as const }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 3' }))
				.toHaveAttribute('aria-current', 'page');
		});

		// ---------------------------------------------------------------------
		// Keyboard navigation (roving tabindex + arrow keys via useListFocus).
		// Selection follows focus: arrow/Home/End move focus and select that page.
		// ---------------------------------------------------------------------

		it('uses roving tabindex — active dot has tabIndex 0, others -1', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, totalPages: 4, variant: 'dots' as const }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 2' }))
				.toHaveAttribute('tabindex', '0');
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 1' }))
				.toHaveAttribute('tabindex', '-1');
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 3' }))
				.toHaveAttribute('tabindex', '-1');
		});

		it('ArrowRight moves focus to the next dot and selects it', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 2, onChange, totalPages: 4, variant: 'dots' as const }
			});
			(screen.getByRole('button', { name: 'Go to page 2' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{ArrowRight}');
			expect(onChange).toHaveBeenCalledWith(3);
			await expect.element(screen.getByRole('button', { name: 'Go to page 3' })).toHaveFocus();
		});

		it('ArrowLeft moves focus to the previous dot and selects it', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 3, onChange, totalPages: 4, variant: 'dots' as const }
			});
			(screen.getByRole('button', { name: 'Go to page 3' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{ArrowLeft}');
			expect(onChange).toHaveBeenCalledWith(2);
			await expect.element(screen.getByRole('button', { name: 'Go to page 2' })).toHaveFocus();
		});

		it('Home selects the first page, End the last', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 3, onChange, totalPages: 5, variant: 'dots' as const }
			});
			(screen.getByRole('button', { name: 'Go to page 3' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{Home}');
			expect(onChange).toHaveBeenCalledWith(1);
			await expect.element(screen.getByRole('button', { name: 'Go to page 1' })).toHaveFocus();

			onChange.mockClear();
			await screen.rerender({ page: 3, onChange, totalPages: 5, variant: 'dots' as const });
			(screen.getByRole('button', { name: 'Go to page 3' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{End}');
			expect(onChange).toHaveBeenCalledWith(5);
			await expect.element(screen.getByRole('button', { name: 'Go to page 5' })).toHaveFocus();
		});

		it('wraps from the last dot to the first with ArrowRight', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 4, onChange, totalPages: 4, variant: 'dots' as const }
			});
			(screen.getByRole('button', { name: 'Go to page 4' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{ArrowRight}');
			expect(onChange).toHaveBeenCalledWith(1);
			await expect.element(screen.getByRole('button', { name: 'Go to page 1' })).toHaveFocus();
		});

		it('wraps from the first dot to the last with ArrowLeft', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 1, onChange, totalPages: 4, variant: 'dots' as const }
			});
			(screen.getByRole('button', { name: 'Go to page 1' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{ArrowLeft}');
			expect(onChange).toHaveBeenCalledWith(4);
			await expect.element(screen.getByRole('button', { name: 'Go to page 4' })).toHaveFocus();
		});

		it('does not navigate with arrow keys when disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: {
					page: 2,
					onChange,
					totalPages: 4,
					variant: 'dots' as const,
					isDisabled: true
				}
			});
			const dot = screen.getByRole('button', { name: 'Go to page 2' });
			await expect.element(dot).toBeDisabled();
			(dot.element() as HTMLElement).focus();
			await userEvent.keyboard('{ArrowRight}');
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('variant: none', () => {
		it('renders only prev/next buttons', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, totalPages: 5, variant: 'none' as const }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page' }))
				.toBeInTheDocument();
			// No page buttons or text indicators
			expect(
				buttonsIn(screen.container).some((b) =>
					/Go to page/.test(b.getAttribute('aria-label') ?? '')
				)
			).toBe(false);
		});
	});

	describe('variant: input', () => {
		it('renders "Page [ n ] / N" with an editable box in page mode', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 3,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const
				}
			});
			const box = screen.getByRole('spinbutton', { name: 'Go to page' });
			await expect.element(box).toBeInTheDocument();
			await expect.element(box).toHaveValue('3');
			// Visible leading "Page" label and trailing "/ N" total (10 pages).
			await expect.element(screen.getByText('Page', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByText('/ 10', { exact: true })).toBeInTheDocument();
			// No page-number buttons and no range readout ("Showing 1–N of M").
			expect(
				buttonsIn(screen.container).some((b) =>
					/Go to page \d/.test(b.getAttribute('aria-label') ?? '')
				)
			).toBe(false);
			expect(screen.container.textContent ?? '').not.toMatch(/Showing/i);
			// Flanked by first/prev/next/last.
			for (const name of [
				'Go to first page',
				'Go to previous page',
				'Go to next page',
				'Go to last page'
			]) {
				await expect.element(screen.getByRole('button', { name })).toBeInTheDocument();
			}
		});

		it('bounds the editable box to [1, totalPages] via a NumberInput', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 3,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const
				}
			});
			// The box is a NumberInput (a spinbutton) whose min/max clamp entries to
			// the valid page range without hand-rolled parsing in Pagination.
			const box = screen.getByRole('spinbutton', { name: 'Go to page' });
			await expect.element(box).toHaveAttribute('aria-valuemin', '1');
			await expect.element(box).toHaveAttribute('aria-valuemax', '10');
		});

		it('commits a typed page on Enter and rejects an over-range entry', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 1, onChange, totalItems: 100, pageSize: 10, variant: 'input' as const }
			});
			const box = pageBox(screen.container);
			await userEvent.clear(box);
			// `type(box, '4{Enter}')` becomes a type plus a keyboard press: this
			// runner's `type` sends the literal braces, and `{Enter}` is a keyboard
			// sequence — the split every suite here makes.
			await userEvent.type(box, '4');
			await userEvent.keyboard('{Enter}');
			expect(onChange).toHaveBeenCalledWith(4);

			onChange.mockClear();
			await userEvent.clear(box);
			// The box is a NumberInput bounded to [1, totalPages]: an over-max entry
			// is rejected and never navigates past the last page.
			await userEvent.type(box, '99');
			await userEvent.keyboard('{Enter}');
			expect(onChange).not.toHaveBeenCalledWith(99);
		});

		it('commits on blur', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 1, onChange, totalItems: 100, pageSize: 10, variant: 'input' as const }
			});
			const box = pageBox(screen.container);
			await userEvent.clear(box);
			await userEvent.type(box, '5');
			await userEvent.tab();
			expect(onChange).toHaveBeenCalledWith(5);
		});

		it('reverts to the current page on an invalid or empty entry', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 3, onChange, totalItems: 100, pageSize: 10, variant: 'input' as const }
			});
			const box = pageBox(screen.container);
			// A number input rejects non-numeric characters, so an invalid entry
			// never navigates and reverts to the committed page on blur.
			await userEvent.clear(box);
			await userEvent.type(box, 'abc');
			await userEvent.tab();
			expect(onChange).not.toHaveBeenCalled();
			expect(box).toHaveValue('3');

			// Emptying the box and blurring reverts to the committed page too.
			await userEvent.clear(box);
			await userEvent.tab();
			expect(onChange).not.toHaveBeenCalled();
			expect(box).toHaveValue('3');
		});

		it('announces the committed page to screen readers', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const
				}
			});
			const box = pageBox(screen.container);
			await userEvent.clear(box);
			await userEvent.type(box, '4');
			await userEvent.keyboard('{Enter}');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Page 4 of 10');
			});
		});

		it('is disabled and does not commit when isDisabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: {
					page: 2,
					onChange,
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const,
					isDisabled: true
				}
			});
			const box = pageBox(screen.container);
			expect(box).toBeDisabled();
			// Restated: upstream types with `user.type`. Playwright refuses to type
			// into a natively disabled element at all, which would assert its
			// actionability heuristic rather than the component, so the keystrokes
			// are aimed the only way a browser allows — a focus the disabled input
			// declines, followed by real key events. Same restatement
			// `number-input.svelte.test.ts` records for its disabled case.
			box.focus();
			expect(document.activeElement).not.toBe(box);
			await userEvent.keyboard('5{Enter}');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('rejects a below-range entry rather than navigating out of range', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 5, onChange, totalItems: 100, pageSize: 10, variant: 'input' as const }
			});
			const box = pageBox(screen.container);
			await userEvent.clear(box);
			// The box is bounded to [1, totalPages]: 0 (and negatives) are below the
			// minimum, so they are rejected and never navigate.
			await userEvent.type(box, '0');
			await userEvent.keyboard('{Enter}');
			expect(onChange).not.toHaveBeenCalledWith(0);
		});

		it('disables the input when the total is unknown (cursor/hasMore)', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, hasMore: true, variant: 'input' as const }
			});
			// With no known page count there is no range to clamp against, so the
			// editable box is inert rather than accepting entries it can't resolve.
			await expect.element(screen.getByRole('spinbutton', { name: 'Go to page' })).toBeDisabled();
		});

		it('renders the localized "Page" label by default and a custom pageLabel', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 2,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const
				}
			});
			// Default: the localized "Page" noun precedes the box.
			await expect.element(screen.getByText('Page', { exact: true })).toBeInTheDocument();

			// A custom pageLabel relabels the box without changing navigation.
			await screen.rerender({
				page: 2,
				onChange: () => {},
				totalItems: 100,
				pageSize: 10,
				variant: 'input' as const,
				pageLabel: 'Row'
			});
			await expect.element(screen.getByText('Row', { exact: true })).toBeInTheDocument();
			expect(screen.getByText('Page', { exact: true }).query()).toBeNull();
			// The trailing "/ N" total stays regardless of the label.
			await expect.element(screen.getByText('/ 10', { exact: true })).toBeInTheDocument();
		});

		it('navigates by page (via onChange) even with a custom pageLabel', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange,
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const,
					pageLabel: 'Row'
				}
			});
			const box = pageBox(screen.container);
			// The box holds the page number, and committing drives page navigation.
			expect(box).toHaveValue('1');
			await userEvent.clear(box);
			await userEvent.type(box, '4');
			await userEvent.keyboard('{Enter}');
			expect(onChange).toHaveBeenCalledWith(4);
		});

		// ---------------------------------------------------------------------
		// First / Last buttons
		// ---------------------------------------------------------------------

		describe('first/last buttons', () => {
			it('first jumps to page 1, last jumps to the final page', async () => {
				const onChange = vi.fn();
				const screen = await render(Pagination, {
					props: { page: 5, onChange, totalItems: 100, pageSize: 10, variant: 'input' as const }
				});
				await userEvent.click(screen.getByRole('button', { name: 'Go to first page' }));
				expect(onChange).toHaveBeenCalledWith(1);

				onChange.mockClear();
				await userEvent.click(screen.getByRole('button', { name: 'Go to last page' }));
				// 100 items / 10 per page → 10 pages.
				expect(onChange).toHaveBeenCalledWith(10);
			});

			it('disables first on the first page and last on the last page', async () => {
				const screen = await render(Pagination, {
					props: {
						page: 1,
						onChange: () => {},
						totalItems: 100,
						pageSize: 10,
						variant: 'input' as const
					}
				});
				await expect
					.element(screen.getByRole('button', { name: 'Go to first page' }))
					.toBeDisabled();
				await expect
					.element(screen.getByRole('button', { name: 'Go to last page' }))
					.not.toBeDisabled();

				await screen.rerender({
					page: 10,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					variant: 'input' as const
				});
				await expect
					.element(screen.getByRole('button', { name: 'Go to last page' }))
					.toBeDisabled();
				await expect
					.element(screen.getByRole('button', { name: 'Go to first page' }))
					.not.toBeDisabled();
			});

			it('hides first/last when hasFirstLast is false', async () => {
				const screen = await render(Pagination, {
					props: {
						page: 3,
						onChange: () => {},
						totalItems: 100,
						pageSize: 10,
						variant: 'input' as const,
						hasFirstLast: false
					}
				});
				expect(buttonNamed(screen.container, 'Go to first page')).toBeUndefined();
				expect(buttonNamed(screen.container, 'Go to last page')).toBeUndefined();
				// prev/next still present.
				await expect
					.element(screen.getByRole('button', { name: 'Go to previous page' }))
					.toBeInTheDocument();
				await expect
					.element(screen.getByRole('button', { name: 'Go to next page' }))
					.toBeInTheDocument();
			});

			it('omits first/last when the total page count is unknown', async () => {
				const screen = await render(Pagination, {
					props: { page: 2, onChange: () => {}, hasMore: true, variant: 'input' as const }
				});
				expect(buttonNamed(screen.container, 'Go to first page')).toBeUndefined();
				expect(buttonNamed(screen.container, 'Go to last page')).toBeUndefined();
			});

			it('renders the double-chevron icons for first/last', async () => {
				const screen = await render(Pagination, {
					props: {
						page: 3,
						onChange: () => {},
						totalItems: 100,
						pageSize: 10,
						variant: 'input' as const
					}
				});
				// Each default double-chevron icon draws two chevron paths in one <path>
				// ("M...M..."); assert both first and last render an svg with two moves.
				const first = screen.getByRole('button', { name: 'Go to first page' }).element();
				const last = screen.getByRole('button', { name: 'Go to last page' }).element();
				for (const btn of [first, last]) {
					const path = btn.querySelector('svg path');
					expect(path).not.toBeNull();
					const d = path?.getAttribute('d') ?? '';
					expect((d.match(/M/g) ?? []).length).toBe(2);
				}
				expect(screen.container).toBeTruthy();
			});

			it('does not add first/last to other variants (e.g. pages)', async () => {
				const screen = await render(Pagination, {
					props: {
						page: 3,
						onChange: () => {},
						totalItems: 100,
						pageSize: 10,
						variant: 'pages' as const
					}
				});
				expect(buttonNamed(screen.container, 'Go to first page')).toBeUndefined();
				expect(buttonNamed(screen.container, 'Go to last page')).toBeUndefined();
			});
		});

		// ---------------------------------------------------------------------
		// Custom label via pageLabel
		// ---------------------------------------------------------------------

		describe('pageLabel', () => {
			it('renders a custom noun while keeping the "/ N" total', async () => {
				const screen = await render(Pagination, {
					props: {
						page: 3,
						onChange: () => {},
						totalItems: 200,
						pageSize: 20,
						variant: 'input' as const,
						pageLabel: 'Row'
					}
				});
				// The custom noun replaces the default "Page"; the total stays.
				await expect.element(screen.getByText('Row', { exact: true })).toBeInTheDocument();
				expect(screen.getByText('Page', { exact: true }).query()).toBeNull();
				await expect.element(screen.getByText('/ 10', { exact: true })).toBeInTheDocument();
				// The box still holds the 1-based page number.
				await expect
					.element(screen.getByRole('spinbutton', { name: 'Go to page' }))
					.toHaveValue('3');
			});

			it('keeps the input page-navigating with a custom label', async () => {
				const onChange = vi.fn();
				const screen = await render(Pagination, {
					props: {
						page: 1,
						onChange,
						totalPages: 10,
						variant: 'input' as const,
						pageLabel: 'Row'
					}
				});
				const box = pageBox(screen.container);
				await userEvent.clear(box);
				await userEvent.type(box, '5');
				await userEvent.keyboard('{Enter}');
				expect(onChange).toHaveBeenCalledWith(5);
			});
		});
	});

	describe('page change callbacks', () => {
		it('does not announce on initial mount', async () => {
			await render(Pagination, { props: { page: 1, onChange: () => {}, totalPages: 10 } });
			expect(politeRegion()).toBeNull();
		});

		it('announces the new page politely when navigating', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, totalPages: 10 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Page 3 of 10');
			});
		});

		it('announces the next page when clicking next', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, totalPages: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Page 3 of 5');
			});
		});

		it('announces without a total when only hasMore is known', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, hasMore: true }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Page 2');
			});
		});

		it('calls onChange when clicking a page button', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 1, onChange, totalPages: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
			expect(onChange).toHaveBeenCalledWith(3);
		});

		it('calls onChange when clicking next', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 2, onChange, totalPages: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			expect(onChange).toHaveBeenCalledWith(3);
		});

		it('calls onChange when clicking previous', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 3, onChange, totalPages: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
			expect(onChange).toHaveBeenCalledWith(2);
		});

		it('calls onChange when clicking a dot', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 1, onChange, totalPages: 5, variant: 'dots' as const }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to page 4' }));
			expect(onChange).toHaveBeenCalledWith(4);
		});
	});

	describe('step', () => {
		it('advances next by step pages', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 1, onChange, totalPages: 20, step: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go forward 5 pages' }));
			expect(onChange).toHaveBeenCalledWith(6);
		});

		it('moves previous by step pages', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 11, onChange, totalPages: 20, step: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go back 5 pages' }));
			expect(onChange).toHaveBeenCalledWith(6);
		});

		it('clamps a next step that would overshoot to the last page', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 18, onChange, totalPages: 20, step: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go forward 5 pages' }));
			expect(onChange).toHaveBeenCalledWith(20);
		});

		it('clamps a previous step that would undershoot to the first page', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 3, onChange, totalPages: 20, step: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go back 5 pages' }));
			expect(onChange).toHaveBeenCalledWith(1);
		});

		it('falls back to a single-page step for non-integer or < 1 values', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 5, onChange, totalPages: 20, step: 0 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			expect(onChange).toHaveBeenLastCalledWith(6);

			await screen.rerender({ page: 5, onChange, totalPages: 20, step: 2.5 });
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			expect(onChange).toHaveBeenLastCalledWith(6);
		});

		it('steps the input variant by step pages', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange,
					totalItems: 500,
					pageSize: 25,
					variant: 'input' as const,
					step: 5
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go forward 5 pages' }));
			expect(onChange).toHaveBeenCalledWith(6);
		});

		it('names the prev/next buttons for the stride when step > 1', async () => {
			const screen = await render(Pagination, {
				props: { page: 5, onChange: () => {}, totalPages: 20, step: 5 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go forward 5 pages' }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: 'Go back 5 pages' }))
				.toBeInTheDocument();
		});

		it('keeps the single-page names when step is 1', async () => {
			const screen = await render(Pagination, {
				props: { page: 5, onChange: () => {}, totalPages: 20, step: 1 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page' }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeInTheDocument();
		});
	});

	describe('changeAction', () => {
		it('fires onChange then changeAction with the new page', async () => {
			const order: string[] = [];
			const onChange = vi.fn(() => order.push('onChange'));
			const changeAction = vi.fn(() => {
				order.push('changeAction');
			});
			const screen = await render(Pagination, {
				props: { page: 1, onChange, changeAction, totalPages: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			expect(onChange).toHaveBeenCalledWith(2);
			expect(changeAction).toHaveBeenCalledWith(2);
			expect(order).toEqual(['onChange', 'changeAction']);
		});

		it('shows the optimistic page while changeAction is pending', async () => {
			let resolveAction: (() => void) | undefined;
			const changeAction = vi.fn(
				async () =>
					new Promise<void>((resolve) => {
						resolveAction = resolve;
					})
			);
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					changeAction,
					totalPages: 5,
					variant: 'compact' as const
				}
			});

			// The committed `page` prop stays at 1, but the indicator optimistically
			// reflects the page being navigated to.
			await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
			expect(changeAction).toHaveBeenCalledWith(2);
			await vi.waitFor(() => {
				expect(screen.container.querySelector('nav')).toHaveTextContent('Page 2 of 5');
			});

			resolveAction?.();
		});

		it('interrupts an in-flight action on rapid next clicks', async () => {
			// Each click derives its target from the optimistic page, so clicking
			// next twice before the action settles advances 1 -> 2 -> 3 instead of
			// being dropped by a re-entry guard.
			const resolvers: (() => void)[] = [];
			const changeAction = vi.fn(
				async () =>
					new Promise<void>((resolve) => {
						resolvers.push(resolve);
					})
			);
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					changeAction,
					totalPages: 5,
					variant: 'compact' as const
				}
			});

			const next = screen.getByRole('button', { name: 'Go to next page' }).element();
			const nav = screen.container.querySelector('nav')!;
			// RESTATED: native clicks rather than `userEvent`, for the reason
			// upstream wraps each in `act` — both must land while the first action
			// is still pending, which is the whole point of the case.
			(next as HTMLElement).click();
			// Scope to the nav landmark: the live region on document.body also
			// carries the announced page text.
			await vi.waitFor(() => {
				expect(nav).toHaveTextContent('Page 2 of 5');
			});
			(next as HTMLElement).click();
			await vi.waitFor(() => {
				expect(nav).toHaveTextContent('Page 3 of 5');
			});

			expect(changeAction).toHaveBeenCalledTimes(2);
			expect(changeAction).toHaveBeenNthCalledWith(1, 2);
			expect(changeAction).toHaveBeenNthCalledWith(2, 3);

			resolvers.forEach((resolve) => resolve());
		});

		it('supports a synchronous changeAction', async () => {
			const changeAction = vi.fn((_page: number) => {});
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 2, onChange, changeAction, totalPages: 5 }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
			expect(onChange).toHaveBeenCalledWith(1);
			expect(changeAction).toHaveBeenCalledWith(1);
		});

		it('does not fire changeAction when disabled', async () => {
			const changeAction = vi.fn();
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					changeAction,
					totalPages: 5,
					isDisabled: true
				}
			});
			// RESTATED: the next button is `disabled`, and Playwright refuses to
			// click a disabled element — a native click exercises the component's
			// own guard instead of the driver's actionability heuristic.
			(screen.getByRole('button', { name: 'Go to next page' }).element() as HTMLElement).click();
			expect(changeAction).not.toHaveBeenCalled();
		});
	});

	describe('boundary states', () => {
		it('disables previous button on first page', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 5 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeDisabled();
		});

		it('disables next button on last page', async () => {
			const screen = await render(Pagination, {
				props: { page: 5, onChange: () => {}, totalPages: 5 }
			});
			await expect.element(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
		});

		it('enables both buttons on middle page', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 5 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.not.toBeDisabled();
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page' }))
				.not.toBeDisabled();
		});

		it('disables both buttons when only one page', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 1 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeDisabled();
			await expect.element(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
		});
	});

	describe('cursor-based mode', () => {
		it('enables next when hasMore is true', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, hasMore: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page' }))
				.not.toBeDisabled();
		});

		it('disables next when hasMore is false', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, hasMore: false }
			});
			await expect.element(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
		});

		it('disables previous on first page with hasMore', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, hasMore: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeDisabled();
		});

		it('enables previous on page > 1 with hasMore', async () => {
			const screen = await render(Pagination, {
				props: { page: 2, onChange: () => {}, hasMore: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.not.toBeDisabled();
		});
	});

	describe('page size selector', () => {
		it('renders page size selector when pageSizeOptions provided', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalItems: 100,
					pageSize: 10,
					pageSizeOptions: [10, 20, 50],
					onPageSizeChange: () => {}
				}
			});
			// The selector should be present (hidden label "Items per page")
			await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
		});

		it('does not render page size selector when pageSizeOptions not provided', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalPages: 5 }
			});
			const nav = screen.container.querySelector('nav')!;
			// Only prev/next + page buttons should exist
			expect(buttonsIn(nav).length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('disabled state', () => {
		it('disables all page buttons when isDisabled', async () => {
			const screen = await render(Pagination, {
				props: { page: 3, onChange: () => {}, totalPages: 5, isDisabled: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page' }))
				.toBeDisabled();
			await expect.element(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
			// Page buttons should also be disabled
			await expect.element(screen.getByRole('button', { name: 'Go to page 1' })).toBeDisabled();
		});

		it('does not call onChange when disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Pagination, {
				props: { page: 3, onChange, totalPages: 5, isDisabled: true }
			});
			// RESTATED: disabled buttons can't be clicked — Playwright refuses, so
			// the click is dispatched natively and the component's guard is what the
			// case pins.
			(screen.getByRole('button', { name: 'Go to page 1' }).element() as HTMLElement).click();
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('totalItems calculation', () => {
		it('calculates totalPages from totalItems and pageSize', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalItems: 95, pageSize: 10 }
			});
			// 95 / 10 = 10 pages, should show page 10
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 10' }))
				.toBeInTheDocument();
		});

		it('uses default pageSize of 10', async () => {
			const screen = await render(Pagination, {
				props: { page: 1, onChange: () => {}, totalItems: 45 }
			});
			// 45 / 10 = 5 pages
			expect(buttonNamed(screen.container, 'Go to page 5')).toBeInTheDocument();
			expect(buttonNamed(screen.container, 'Go to page 6')).toBeUndefined();
		});
	});

	describe('rest forwarding', () => {
		it('forwards data-testid, id, and aria-* to the root nav', async () => {
			const screen = await render(Pagination, {
				props: {
					page: 1,
					onChange: () => {},
					totalPages: 3,
					'data-testid': 'pager',
					id: 'pager-1',
					'aria-describedby': 'hint'
				}
			});
			const nav = screen.container.querySelector('nav')!;
			expect(nav).toHaveAttribute('data-testid', 'pager');
			expect(nav).toHaveAttribute('id', 'pager-1');
			expect(nav).toHaveAttribute('aria-describedby', 'hint');
		});
	});
});
