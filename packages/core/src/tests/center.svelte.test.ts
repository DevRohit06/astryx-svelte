import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Center from '$lib/components/center/center.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Center/Center.test.tsx` — **5 of upstream's 16**, and the file is new
 * with this batch.
 *
 * `Center` had **no ported suite at all**, a pre-existing gap recorded in
 * port/todo.md; the 11 cases upstream carried at 0.2.0 (rendering, `axis`, the four
 * size props, `isInline`, `xstyle`, `className`/`style`, `data-testid`) are
 * still unported and are deliberately left counted here rather than closed
 * quietly. What lands is exactly the 5 cases 0.3.0 added for the new `padding` /
 * `paddingInline` / `paddingBlock` props, which is what this batch's change
 * needs. Nothing beyond upstream is invented.
 *
 * `children` is a `Snippet` here, so upstream's inline `<div>Content</div>` is
 * supplied through the shared `slot-probe`. `rerender` merges the probe's props,
 * and `rest` is one of them — passing a fresh `rest` object replaces the target's
 * props wholesale, which is what upstream's re-render with a different element
 * does.
 */

/** Renders a `Center` whose `children` slot holds a `<span>Content</span>`. */
function renderCenter(rest: Record<string, unknown>): Promise<Awaited<ReturnType<typeof render>>> {
	return render(SlotProbe, {
		props: { component: Center, slot: 'children', text: 'Content', rest }
	});
}

describe('Center', () => {
	it('applies a class when padding is set', async () => {
		const screen = await renderCenter({ 'data-testid': 'center' });
		const baseline = screen.getByTestId('center').element().className;
		await screen.rerender({ rest: { padding: 3, 'data-testid': 'center' } });
		const withPadding = screen.getByTestId('center').element().className;
		expect(withPadding).not.toBe('');
		expect(withPadding).not.toBe(baseline);
	});

	it('accepts paddingInline and paddingBlock without error', async () => {
		const screen = await renderCenter({
			paddingInline: 4,
			paddingBlock: 2,
			'data-testid': 'center'
		});
		await expect.element(screen.getByTestId('center')).toBeInTheDocument();
	});

	it('lets paddingInline/paddingBlock override padding on their axis', async () => {
		// padding sets both axes; paddingInline overrides the inline axis. The
		// component should render without conflict and carry a class.
		const screen = await renderCenter({ padding: 2, paddingInline: 5, 'data-testid': 'center' });
		expect(screen.getByTestId('center').element().className).not.toBe('');
	});

	it('applies a class for explicit padding={0} (zero is a valid spacing step)', async () => {
		const screen = await renderCenter({ 'data-testid': 'center' });
		const baseline = screen.getByTestId('center').element().className;
		await screen.rerender({ rest: { padding: 0, 'data-testid': 'center' } });
		expect(screen.getByTestId('center').element().className).not.toBe(baseline);
	});

	it('leaves the default className unchanged when no padding props are set', async () => {
		const screen = await renderCenter({ 'data-testid': 'center' });
		const baseline = screen.getByTestId('center').element().className;
		// Opting in changes the className...
		await screen.rerender({ rest: { padding: 3, 'data-testid': 'center' } });
		expect(screen.getByTestId('center').element().className).not.toBe(baseline);
		// ...and dropping the prop restores the exact default output.
		await screen.rerender({ rest: { 'data-testid': 'center' } });
		expect(screen.getByTestId('center').element().className).toBe(baseline);
	});
});
