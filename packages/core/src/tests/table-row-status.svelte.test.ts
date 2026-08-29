import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RowStatusTable, {
	rowStatusData,
	type Row
} from './fixtures/table-row-status-fixture.svelte';
import type { TableRowStatus } from '$lib/components/table/plugins/row-status/use-table-row-status.js';

/**
 * Ported from Astryx's `Table/plugins/rowStatus/useTableRowStatus.test.tsx` —
 * all **9** of its `it` cases at the 0.5.0 pin, in upstream's order and under
 * upstream's names.
 * Nothing dropped.
 *
 * ## Standing translations
 *
 * - **Upstream's `Harness` becomes a probe fixture**, because a hook has to run
 *   during a component's init.
 * - **`within(row).queryByRole('img')` is a container query.** The indicator's
 *   accessible name *is* its `aria-label`, so `[role="img"]` under the row asks
 *   the same question without going through a locator that re-synthesises its
 *   selector from the accessible name.
 * - **The colour lands in an inline custom property on both sides.** A StyleX
 *   function style compiles to a `--x-backgroundColor` declaration in the
 *   element's `style` attribute, which is what upstream's two colour cases read;
 *   the assertion transcribes unchanged.
 *
 * ## Coverage note
 *
 * These two colour cases matter more than their size suggests: `styles.dot` is a
 * **function style**, and the class oracle cannot see one at all (`extractGroups`
 * requires `$$css: true`, which an arrow-function value does not carry). This
 * suite is therefore the *only* mechanical check that the dot's colour resolves
 * — the oracle's clean run says nothing about it. See the note at the head of
 * `scripts/compare-upstream-classes.mjs`.
 */

/** Only the part of a `render()` result these container queries read. */
interface Screen {
	container: HTMLElement;
}

function headers(screen: Screen): HTMLElement[] {
	return Array.from(screen.container.querySelectorAll<HTMLElement>('th'));
}

function rows(screen: Screen): HTMLElement[] {
	return Array.from(screen.container.querySelectorAll<HTMLElement>('tr'));
}

/** Upstream's `screen.getByRole('img', {name})`; the name is the aria-label. */
function indicatorNamed(screen: Screen, name: string): HTMLElement | null {
	return screen.container.querySelector<HTMLElement>(`[role="img"][aria-label="${name}"]`);
}

describe('useTableRowStatus', () => {
	it('prepends a narrow status column with an empty header', async () => {
		const screen = await render(RowStatusTable, { props: {} });
		// Status column is first; its header is empty.
		expect(headers(screen)[0]).toHaveAttribute('data-column-key', '__rowStatus');
		expect(headers(screen)[0].textContent).toBe('');
	});

	it('renders a labeled dot for rows with a status', async () => {
		const screen = await render(RowStatusTable, { props: {} });
		expect(indicatorNamed(screen, 'Error')).toBeInTheDocument();
		expect(indicatorNamed(screen, 'Warning')).toBeInTheDocument();
	});

	it('renders a dot (not an icon) by default', async () => {
		const screen = await render(RowStatusTable, { props: {} });
		// Default (no icon) renders a plain colored dot: no svg in the indicator.
		const dot = indicatorNamed(screen, 'Error')!;
		expect(dot.querySelector('svg')).toBeNull();
	});

	it('renders no indicator for rows returning null', async () => {
		const screen = await render(RowStatusTable, { props: {} });
		// rows[2] is Bob (state ok): no status indicator in his status cell.
		const bob = rows(screen)[2];
		expect(bob.textContent).toContain('Bob');
		expect(bob.querySelector('[role="img"]')).toBeNull();
	});

	it('maps a semantic color name to its icon color token', async () => {
		const screen = await render(RowStatusTable, { props: {} });
		const errorDot = indicatorNamed(screen, 'Error')!;
		// 'red' resolves to var(--color-icon-red); StyleX emits it on the inline
		// style of the inner dot element.
		const dot = errorDot.querySelector('span');
		expect(dot?.getAttribute('style')).toContain('--color-icon-red');
	});

	it('passes through a raw CSS color as an escape hatch', async () => {
		const statusFn = (item: Row): TableRowStatus | null =>
			item.state === 'error' ? { color: 'rgb(1, 2, 3)', label: 'Raw' } : null;
		const screen = await render(RowStatusTable, { props: { statusFn } });

		const indicator = indicatorNamed(screen, 'Raw')!;
		const dot = indicator.querySelector('span');
		expect(dot?.getAttribute('style')).toContain('rgb(1, 2, 3)');
	});

	it('renders an icon as the status signifier when icon is provided', async () => {
		const statusFn = (item: Row): TableRowStatus | null =>
			item.state === 'error' ? { color: 'red', icon: 'error', label: 'Error' } : null;
		const screen = await render(RowStatusTable, { props: { statusFn } });

		// Icon-mode still exposes the accessible label via role=img.
		const indicator = indicatorNamed(screen, 'Error');
		expect(indicator).toBeInTheDocument();
		// An SVG icon is rendered inside the indicator (dot mode has no svg).
		expect(indicator!.querySelector('svg')).not.toBeNull();
	});

	it('exposes the required label as the accessible name in dot mode', async () => {
		const statusFn = (item: Row): TableRowStatus | null =>
			item.state === 'error' ? { color: 'red', label: 'Error' } : null;
		const screen = await render(RowStatusTable, { props: { statusFn } });

		// Label is required, so every dot is announced via role=img with its name.
		const indicator = indicatorNamed(screen, 'Error');
		expect(indicator).toBeInTheDocument();
		// Dot mode renders no svg (that is icon mode).
		expect(indicator!.querySelector('svg')).toBeNull();
		expect(screen.container.textContent).toContain('Alice');
	});

	it('renders the status header with empty data and no indicators', async () => {
		const screen = await render(RowStatusTable, { props: { rows: [] as Row[] } });
		expect(headers(screen)[0]).toHaveAttribute('data-column-key', '__rowStatus');
		expect(screen.container.querySelector('[role="img"]')).toBeNull();
	});
});

// `rowStatusData` is exercised through the fixture's default; naming the import
// keeps the fixture's exported test data on one declaration site, as the other
// table plugin suites do.
void rowStatusData;
