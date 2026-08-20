import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import GridHarness from './fixtures/grid-harness.svelte';

/**
 * Astryx's `Grid/Grid.test.tsx` — **36 of upstream's 36** `it` declarations at
 * the 0.4.5 pin (28 under `describe('Grid')`, 8 under `describe('GridSpan')`).
 * Nothing is dropped.
 *
 * Two translations, neither a dropped case:
 *
 * - both `forwards ref correctly` cases become the repo's standing attachment
 *   counterpart. Svelte has no `ref` prop; `Grid` and `GridSpan` rest-spread
 *   onto their root `<div>`, so an attachment in the rest props reaches exactly
 *   the element upstream's `ref` does — and receives the node, which is more
 *   than upstream's `expect.any(HTMLElement)` proves.
 * - `children` is a `Snippet` here, so upstream's inline `<div>Item 1</div>` /
 *   `<GridSpan>…</GridSpan>` children come from `fixtures/grid-harness.svelte`.
 *
 * `port/debts.md` records that our `Grid` keeps upstream's **deprecated**
 * `minChildWidth` prop, which 0.4.5 no longer declares. It defaults to `0` and
 * no upstream case sets it, so the deprecated branch of `resolveTemplateColumns`
 * is inert for every case here and none is affected by the divergence.
 */

/**
 * The track template is applied via a StyleX dynamic style: the element carries
 * an inline CSS variable while the `grid-template-columns` declaration lives in
 * a class (so consumer xstyle/@media overrides can win). `--x-gridTemplateColumns`
 * is the debug-mode variable name emitted by the StyleX transform in tests —
 * `vite.config.ts` runs the plugin with `dev: true` outside production, exactly
 * as upstream's test environment does.
 */
function templateColumns(el: HTMLElement): string {
	return el.style.getPropertyValue('--x-gridTemplateColumns');
}

/** Renders the harness and hands back the `data-testid="grid"` root. */
async function renderGrid(
	grid: Record<string | symbol, unknown>,
	items: string[] = ['Item']
): Promise<HTMLElement> {
	const screen = await render(GridHarness, { props: { grid, items } });
	return screen.getByTestId('grid').element() as HTMLElement;
}

describe('Grid', () => {
	it('renders with fixed columns', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 3, 'data-testid': 'grid' },
				items: ['Item 1', 'Item 2', 'Item 3']
			}
		});
		const locator = screen.getByTestId('grid');
		await expect.element(locator).toBeInTheDocument();
		expect(templateColumns(locator.element() as HTMLElement)).toBe('repeat(3, 1fr)');
	});

	it('does not write grid-template-columns as a raw inline style (regression: inline style defeats xstyle/@media overrides)', async () => {
		const grid = await renderGrid({ columns: 3, rowHeight: 80, 'data-testid': 'grid' }, ['Item 1']);
		// The declaration must live in a class (via CSS-var indirection), never
		// as a raw inline property — inline would beat any consumer override.
		expect(grid.style.gridTemplateColumns).toBe('');
		expect(grid.style.gridAutoRows).toBe('');
		expect(templateColumns(grid)).toBe('repeat(3, 1fr)');
		expect(grid.style.getPropertyValue('--x-gridAutoRows')).toBe('80px');
	});

	it('renders with columns object (auto-fill default)', async () => {
		const grid = await renderGrid({ columns: { minWidth: 250 }, 'data-testid': 'grid' }, [
			'Item 1',
			'Item 2'
		]);
		expect(templateColumns(grid)).toBe('repeat(auto-fill, minmax(250px, 1fr))');
	});

	it('renders with columns object max (count capped, tracks still fill)', async () => {
		const grid = await renderGrid(
			{ columns: { minWidth: 250, max: 3 }, gap: 4, 'data-testid': 'grid' },
			['Item 1', 'Item 2', 'Item 3']
		);
		// Cap lives on the track MIN (min(100%, max(minWidth, perColumn))); the
		// track MAX stays 1fr so present columns fill the row (a lone column on
		// mobile stretches to 100% instead of leaving dead space).
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fill, minmax(min(100%, max(250px, calc((100% - 2 * var(--spacing-4)) / 3))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});

	it('keeps track max at 1fr with a max cap so a lone column can fill (#3391)', async () => {
		// Regression: previously the cap was applied to the track MAX
		// (minmax(minWidth, 100%/max)), so when fewer than `max` columns fit —
		// e.g. a single column on mobile — the lone column was pinned to ~100%/max
		// and left dead space on the right. The cap now lives on the track MIN and
		// the track MAX stays 1fr, so present columns always stretch to fill.
		const grid = await renderGrid(
			{ columns: { minWidth: 360, max: 2 }, gap: 4, 'data-testid': 'grid' },
			['Left', 'Right']
		);
		const template = templateColumns(grid);
		// Track max must be 1fr (fills), not a fraction-of-container cap.
		expect(template).toMatch(/, 1fr\)\)$/);
		expect(template).not.toMatch(/, calc\([^)]*\/ 2\)\)\)$/);
		expect(template).toBe(
			'repeat(auto-fill, minmax(min(100%, max(360px, calc((100% - 1 * var(--spacing-4)) / 2))), 1fr))'
		);
	});

	it('renders with columns object max using columnGap', async () => {
		const grid = await renderGrid(
			{ columns: { minWidth: 200, max: 4 }, columnGap: 6, 'data-testid': 'grid' },
			['Item 1', 'Item 2']
		);
		// columnGap takes precedence in the perColumn floor calculation
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fill, minmax(min(100%, max(200px, calc((100% - 3 * var(--spacing-6)) / 4))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});

	it('applies gap correctly', async () => {
		const screen = await render(GridHarness, {
			props: { grid: { columns: 2, gap: 4, 'data-testid': 'grid' }, items: ['Item 1', 'Item 2'] }
		});
		await expect.element(screen.getByTestId('grid')).toBeInTheDocument();
		// Gap is applied via stylex class, just verify component renders
	});

	it('applies rowGap and columnGap separately', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 2, rowGap: 2, columnGap: 6, 'data-testid': 'grid' },
				items: ['Item 1', 'Item 2']
			}
		});
		await expect.element(screen.getByTestId('grid')).toBeInTheDocument();
		// Gaps are applied via stylex classes
	});

	it('applies alignment props', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 2, align: 'center', justify: 'start', 'data-testid': 'grid' },
				items: ['Item 1', 'Item 2']
			}
		});
		await expect.element(screen.getByTestId('grid')).toBeInTheDocument();
		// Alignment is applied via stylex classes
	});

	it('defaults to 1 column when nothing specified', async () => {
		const grid = await renderGrid({ 'data-testid': 'grid' }, ['Item 1']);
		expect(templateColumns(grid)).toBe('1fr');
	});

	// --- P1: columns={0} guard (hardening #719) ---

	it('falls back to 1fr when columns={0}', async () => {
		const grid = await renderGrid({ columns: 0, 'data-testid': 'grid' });
		// columns={0} must not produce repeat(0, 1fr) — should fall back to default
		expect(templateColumns(grid)).toBe('1fr');
	});

	it('falls back to 1fr when columns is negative', async () => {
		const grid = await renderGrid({ columns: -1, 'data-testid': 'grid' });
		expect(templateColumns(grid)).toBe('1fr');
	});

	it('uses auto-fill with a plain 1fr track when no max specified', async () => {
		const grid = await renderGrid({ columns: { minWidth: 200 }, 'data-testid': 'grid' });
		expect(templateColumns(grid)).toBe('repeat(auto-fill, minmax(200px, 1fr))');
		expect(grid.style.maxWidth).toBe('');
	});

	// --- P2: width/height props (hardening #719) ---

	it('applies numeric width as pixels', async () => {
		const grid = await renderGrid({ columns: 2, width: 600, 'data-testid': 'grid' });
		expect(grid.style.width).toBe('600px');
	});

	it('applies string width as-is', async () => {
		const grid = await renderGrid({ columns: 2, width: '100%', 'data-testid': 'grid' });
		expect(grid.style.width).toBe('100%');
	});

	it('applies numeric height as pixels', async () => {
		const grid = await renderGrid({ columns: 2, height: 400, 'data-testid': 'grid' });
		expect(grid.style.height).toBe('400px');
	});

	it('applies string height as-is', async () => {
		const grid = await renderGrid({ columns: 2, height: '50vh', 'data-testid': 'grid' });
		expect(grid.style.height).toBe('50vh');
	});

	// --- P2: columns object + columnGap interaction (hardening #719) ---

	it('uses columnGap var in the count-cap floor when both columnGap and gap are set', async () => {
		const grid = await renderGrid({
			columns: { minWidth: 200, max: 3 },
			gap: 2,
			columnGap: 6,
			'data-testid': 'grid'
		});
		// columnGap takes precedence over gap in the perColumn floor
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fill, minmax(min(100%, max(200px, calc((100% - 2 * var(--spacing-6)) / 3))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});

	it('uses gap var in the count-cap floor when columnGap is not set', async () => {
		const grid = await renderGrid({
			columns: { minWidth: 150, max: 2 },
			gap: 3,
			'data-testid': 'grid'
		});
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fill, minmax(min(100%, max(150px, calc((100% - 1 * var(--spacing-3)) / 2))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});

	it('uses simple fraction in the count-cap floor when no gap is set', async () => {
		const grid = await renderGrid({ columns: { minWidth: 100, max: 3 }, 'data-testid': 'grid' });
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fill, minmax(min(100%, max(100px, calc(100% / 3))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});

	it('forwards ref correctly', async () => {
		// Counterpart: Svelte has no `ref` prop. `Grid` rest-spreads onto its root
		// `<div>`, so an attachment passed through the rest props lands on the same
		// element upstream's callback ref would.
		const attached = vi.fn();
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 2, [createAttachmentKey()]: (node: Element) => attached(node) },
				items: ['Item']
			}
		});
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('passes through additional props', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 2, 'data-testid': 'grid', 'aria-label': 'Product grid' },
				items: ['Item']
			}
		});
		await expect.element(screen.getByTestId('grid')).toHaveAttribute('aria-label', 'Product grid');
	});

	it('renders children correctly', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 3, 'data-testid': 'grid' },
				items: ['Item 1', 'Item 2', 'Item 3']
			}
		});
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 3')).toBeInTheDocument();
	});

	// --- columns object API ---

	it('renders with columns={{minWidth}} using auto-fill', async () => {
		const grid = await renderGrid({ columns: { minWidth: 280 }, 'data-testid': 'grid' }, [
			'Item 1',
			'Item 2'
		]);
		expect(templateColumns(grid)).toBe('repeat(auto-fill, minmax(280px, 1fr))');
	});

	it('renders with columns={{minWidth, repeat: "fit"}} using auto-fit', async () => {
		const grid = await renderGrid(
			{ columns: { minWidth: 280, repeat: 'fit' }, 'data-testid': 'grid' },
			['Item 1', 'Item 2']
		);
		expect(templateColumns(grid)).toBe('repeat(auto-fit, minmax(280px, 1fr))');
	});

	it('renders with columns={{minWidth, repeat: "fill"}} using auto-fill', async () => {
		const grid = await renderGrid(
			{ columns: { minWidth: 280, repeat: 'fill' }, 'data-testid': 'grid' },
			['Item 1', 'Item 2']
		);
		expect(templateColumns(grid)).toBe('repeat(auto-fill, minmax(280px, 1fr))');
	});

	it('renders with columns={{minWidth, max}} capping the count while filling', async () => {
		const grid = await renderGrid(
			{ columns: { minWidth: 280, max: 3 }, gap: 4, 'data-testid': 'grid' },
			['Item 1', 'Item 2']
		);
		// Count is capped via the track MIN; track MAX stays 1fr so present
		// columns fill the row (grid stays full width).
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fill, minmax(min(100%, max(280px, calc((100% - 2 * var(--spacing-4)) / 3))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});

	it('renders with columns={{minWidth, max, repeat: "fit"}} using auto-fit + count cap', async () => {
		const grid = await renderGrid(
			{ columns: { minWidth: 280, max: 3, repeat: 'fit' }, gap: 4, 'data-testid': 'grid' },
			['Item 1', 'Item 2']
		);
		expect(templateColumns(grid)).toBe(
			'repeat(auto-fit, minmax(min(100%, max(280px, calc((100% - 2 * var(--spacing-4)) / 3))), 1fr))'
		);
		expect(grid.style.maxWidth).toBe('');
	});
});

describe('GridSpan', () => {
	it('spans correct number of columns', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 4 },
				span: { columns: 2, 'data-testid': 'span' },
				spanText: 'Wide item'
			}
		});
		const span = screen.getByTestId('span').element() as HTMLElement;
		expect(span.style.gridColumn).toBe('span 2');
	});

	it('spans full width with columns="full"', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 4 },
				span: { columns: 'full', 'data-testid': 'span' },
				spanText: 'Full width'
			}
		});
		const span = screen.getByTestId('span').element() as HTMLElement;
		expect(span.style.gridColumn).toBe('1 / -1');
	});

	it('spans correct number of rows', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 3 },
				span: { rows: 2, 'data-testid': 'span' },
				spanText: 'Tall item'
			}
		});
		const span = screen.getByTestId('span').element() as HTMLElement;
		expect(span.style.gridRow).toBe('span 2');
	});

	it('spans both columns and rows', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 4 },
				span: { columns: 2, rows: 2, 'data-testid': 'span' },
				spanText: '2x2 item'
			}
		});
		const span = screen.getByTestId('span').element() as HTMLElement;
		expect(span.style.gridColumn).toBe('span 2');
		expect(span.style.gridRow).toBe('span 2');
	});

	it('renders without span props', async () => {
		const screen = await render(GridHarness, {
			props: { grid: { columns: 3 }, span: { 'data-testid': 'span' }, spanText: 'Normal item' }
		});
		const locator = screen.getByTestId('span');
		await expect.element(locator).toBeInTheDocument();
		const span = locator.element() as HTMLElement;
		expect(span.style.gridColumn).toBe('');
		expect(span.style.gridRow).toBe('');
	});

	it('forwards ref correctly', async () => {
		// Counterpart, as above: `GridSpan` rest-spreads onto its root `<div>`, so
		// an attachment in the rest props reaches the element upstream's `ref` does.
		const attached = vi.fn();
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 2 },
				span: { 'data-testid': 'span', [createAttachmentKey()]: (node: Element) => attached(node) },
				spanText: 'Item'
			}
		});
		const span = screen.getByTestId('span').element();
		expect(attached).toHaveBeenCalledWith(span);
		expect(span).toBeInstanceOf(HTMLElement);
	});

	it('passes through additional props', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 2 },
				span: { columns: 2, 'data-testid': 'span', 'aria-label': 'Featured item' },
				spanText: 'Content'
			}
		});
		await expect.element(screen.getByTestId('span')).toHaveAttribute('aria-label', 'Featured item');
	});

	it('renders children correctly', async () => {
		const screen = await render(GridHarness, {
			props: {
				grid: { columns: 3 },
				span: { columns: 'full' },
				spanText: 'Child content',
				spanChildTestid: 'child'
			}
		});
		await expect.element(screen.getByTestId('child')).toBeInTheDocument();
	});
});
