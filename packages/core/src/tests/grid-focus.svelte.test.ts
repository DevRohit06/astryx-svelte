import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Grid from './fixtures/grid-focus-fixture.svelte';

/**
 * Ported from Astryx's `hooks/useGridFocus.test.tsx`, all **twelve** cases at
 * the 0.5.0 pin, across its two describe blocks (8 roving tabindex, 4 RTL
 * auto-detection). Nothing is dropped.
 *
 * (The previous header said "all eight cases" and counted only the first block;
 * the whole `useGridFocus RTL auto-detection (WCAG 1.3.2)` describe was unported
 * and unnamed. All four are ported here and all four passed on the first run.)
 *
 * One case needed a mechanical change, and it is the one that proves the port's
 * only invented mechanism works. Upstream's "handleFocus repairs the stop"
 * rerenders with the tabbable cell disabled and then fires the container's
 * onFocus. Here the rerender *itself* repairs the stop, because the
 * `MutationObserver` standing in for upstream's dependency-less layout effect
 * sees the `disabled` attribute land — so the case asserts the repair twice:
 * once after the rerender settles, and again after the focus event, which is
 * the path upstream's assertion is actually about.
 *
 * The focus event is `focusin`, not `focus`: React's synthetic `onFocus` is
 * delivered by the bubbling `focusin`, and `onfocusin` is its Svelte
 * counterpart. A `focus` event does not bubble and would never reach the
 * container.
 */

function keyDown(element: Element, init: KeyboardEventInit): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
}

describe('useGridFocus roving tabindex (hasRovingTabIndex)', () => {
	it('honors the seeded tab stop and stamps -1 on the rest', async () => {
		const screen = await render(Grid, { props: { seed: 4 } });
		await expect.element(screen.getByTestId('cell-4')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('cell-0')).toHaveAttribute('tabindex', '-1');
		await expect.element(screen.getByTestId('cell-8')).toHaveAttribute('tabindex', '-1');
	});

	it('repairs to the first focusable cell when no cell is seeded', async () => {
		const screen = await render(Grid, { props: { seed: -1 } });
		await expect.element(screen.getByTestId('cell-0')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('cell-1')).toHaveAttribute('tabindex', '-1');
	});

	it('promotes the first ENABLED cell when the seed is disabled', async () => {
		const screen = await render(Grid, { props: { seed: -1, disabled: [0, 1] } });
		await expect.element(screen.getByTestId('cell-2')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('cell-0')).toHaveAttribute('tabindex', '-1');
	});

	it('ArrowRight moves the tab stop to the next cell', async () => {
		const screen = await render(Grid, { props: { seed: 0 } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-0').element().focus();
		keyDown(grid, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('cell-1')).toHaveFocus();
		await expect.element(screen.getByTestId('cell-1')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('cell-0')).toHaveAttribute('tabindex', '-1');
	});

	it('ArrowDown moves the tab stop one row down', async () => {
		const screen = await render(Grid, { props: { seed: 0 } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-0').element().focus();
		keyDown(grid, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('cell-3')).toHaveFocus();
		await expect.element(screen.getByTestId('cell-3')).toHaveAttribute('tabindex', '0');
	});

	it('handleFocus repairs the stop when the tabbable cell became disabled', async () => {
		// Seed cell 0 as tabbable, then disable it: syncTabStops should promote the
		// first still-focusable cell (cell 1).
		const screen = await render(Grid, { props: { seed: 0 } });
		const grid = screen.getByRole('grid').element();
		await expect.element(screen.getByTestId('cell-0')).toHaveAttribute('tabindex', '0');

		await screen.rerender({ seed: -1, disabled: [0] });
		await expect.element(screen.getByTestId('cell-1')).toHaveAttribute('tabindex', '0');

		// And the focus path repairs it too, which is what upstream asserts.
		grid.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await expect.element(screen.getByTestId('cell-1')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('cell-0')).toHaveAttribute('tabindex', '-1');
	});

	it('flips ArrowLeft/ArrowRight under RTL', async () => {
		const screen = await render(Grid, { props: { seed: 1, isRtl: true } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-1').element().focus();
		// In RTL, ArrowLeft is "forward" (moves to the next cell in DOM order).
		keyDown(grid, { key: 'ArrowLeft' });
		await expect.element(screen.getByTestId('cell-2')).toHaveFocus();
	});

	it('does not manage tabindex when hasRovingTabIndex is off', async () => {
		const screen = await render(Grid, { props: { seed: 0, hasRovingTabIndex: false } });
		// The seeded -1/0 values are left untouched (caller owns them), and
		// navigation still works without stamping.
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-0').element().focus();
		keyDown(grid, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('cell-1')).toHaveFocus();
		// cell-1 kept its seeded -1; the hook did not promote it.
		await expect.element(screen.getByTestId('cell-1')).toHaveAttribute('tabindex', '-1');
	});
});

describe('useGridFocus RTL auto-detection (WCAG 1.3.2)', () => {
	// Upstream notes that jsdom reflects the `dir` attribute into computed style
	// only on the element that carries it, so its cases set dir="rtl" on the grid
	// container — the element the hook reads. Chromium inherits `direction`
	// properly, but the container is still the element `isRtlElement` measures,
	// so the fixture is upstream's unchanged.

	it('auto-detects dir="rtl": ArrowLeft moves forward (next cell)', async () => {
		const screen = await render(Grid, { props: { seed: 1, dir: 'rtl' } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-1').element().focus();
		keyDown(grid, { key: 'ArrowLeft' });
		await expect.element(screen.getByTestId('cell-2')).toHaveFocus();
	});

	it('auto-detects dir="rtl": ArrowRight moves backward (previous cell)', async () => {
		const screen = await render(Grid, { props: { seed: 1, dir: 'rtl' } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-1').element().focus();
		keyDown(grid, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('cell-0')).toHaveFocus();
	});

	it('leaves vertical navigation unaffected under dir="rtl"', async () => {
		const screen = await render(Grid, { props: { seed: 0, dir: 'rtl' } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-0').element().focus();
		keyDown(grid, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('cell-3')).toHaveFocus();
	});

	it('explicit isRtl={false} overrides a dir="rtl" container', async () => {
		const screen = await render(Grid, { props: { seed: 1, dir: 'rtl', isRtl: false } });
		const grid = screen.getByRole('grid').element();
		screen.getByTestId('cell-1').element().focus();
		keyDown(grid, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('cell-2')).toHaveFocus();
	});
});
