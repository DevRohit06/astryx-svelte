import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/table-sticky-columns-fixture.svelte';

/**
 * Astryx's `Table/plugins/stickyColumns/useTableStickyColumns.test.tsx`, ported
 * case for case — **6 of 6 at the 0.5.0 pin**, in upstream's order and under
 * its titles. Nothing
 * dropped.
 *
 * Upstream's file-level note explains what it asserts and why, and it carries
 * over unchanged: `position: sticky`, the z-index and the background all come
 * from StyleX classes, while the plugin itself owns only the per-column
 * *offset*, written as an inline `inset-inline-start` / `inset-inline-end`. So
 * these cases read the inline offsets. The class names those `xstyle` entries
 * compile to are the class oracle's business
 * (`scripts/compare-upstream-classes.mjs`), not a test's, so nothing here
 * asserts on them.
 *
 * Upstream declares a fresh `Harness` inside each case; they differ only in the
 * config, so `fixtures/table-sticky-columns-fixture.svelte` takes `startKeys` /
 * `endKeys` as props.
 *
 * Standing translations: `render` is async and takes `{ props }`, and
 * `getByRole('columnheader', { name })` returns a locator, so the element comes
 * from `.element()`.
 */

type Screen = Awaited<ReturnType<typeof render>>;

function getHeader(screen: Screen, name: string): HTMLElement {
	return screen.getByRole('columnheader', { name }).element() as HTMLElement;
}

// =============================================================================
// Tests
// =============================================================================

describe('useTableStickyColumns', () => {
	it('pins a start column at inset-inline-start: 0', async () => {
		const screen = await render(Harness, { props: { startKeys: ['name'] } });
		expect(getHeader(screen, 'Name').style.insetInlineStart).toBe('0px');
	});

	it('computes cumulative start offsets for contiguous pinned columns', async () => {
		const screen = await render(Harness, { props: { startKeys: ['name', 'email'] } });
		// name is first → offset 0; email follows → offset = name width (180px)
		expect(getHeader(screen, 'Name').style.insetInlineStart).toBe('0px');
		expect(getHeader(screen, 'Email').style.insetInlineStart).toBe('180px');
	});

	it('pins an end column at inset-inline-end: 0', async () => {
		const screen = await render(Harness, { props: { endKeys: ['status'] } });
		expect(getHeader(screen, 'Status').style.insetInlineEnd).toBe('0px');
	});

	it('pins body cells, not just headers', async () => {
		const screen = await render(Harness, { props: { startKeys: ['name'] } });
		const firstBodyCell = screen.getByText('Alice', { exact: true }).element().closest('td');
		expect(firstBodyCell).not.toBeNull();
		expect(firstBodyCell!.style.insetInlineStart).toBe('0px');
	});

	it('is a no-op with an empty config — no cell gets an offset', async () => {
		const screen = await render(Harness, { props: {} });
		for (const header of ['Name', 'Email', 'Team', 'Status']) {
			const th = getHeader(screen, header);
			expect(th.style.insetInlineStart).toBe('');
			expect(th.style.insetInlineEnd).toBe('');
		}
	});

	it('only pins configured columns, leaving others unset', async () => {
		const screen = await render(Harness, { props: { startKeys: ['name'] } });
		expect(getHeader(screen, 'Name').style.insetInlineStart).toBe('0px');
		expect(getHeader(screen, 'Team').style.insetInlineStart).toBe('');
		expect(getHeader(screen, 'Team').style.insetInlineEnd).toBe('');
	});
});
