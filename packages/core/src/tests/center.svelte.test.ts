import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Center from '$lib/components/center/center.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Center/Center.test.tsx` — **13 of upstream's 24 at the 0.5.0 pin**.
 *
 * `Center` had **no ported suite at all**, a pre-existing gap recorded in
 * port/todo.md. What landed first was exactly the 5 cases 0.3.0 added for the
 * `padding` / `paddingInline` / `paddingBlock` props. The **8-case per-edge
 * padding block added at 0.5.0** is now here too — `paddingBlockStart` on its
 * own, `paddingBlockStart`/`paddingBlockEnd` overriding only their own edge,
 * `paddingBlockEnd` over `paddingBlock`, the no-edge-prop baseline, the three
 * `paddingInline*` mirrors of those, and all four edges resolved independently.
 * That was a **component** gap, not only a test gap: `Center` did not accept
 * the four edge props while `Center.doc.mjs`, generated against the 0.5.0
 * prose, already documented them. The props are ported and the block with them.
 * Nothing beyond upstream is invented.
 *
 * **The other 11 are unported**, and are deliberately left counted here rather
 * than closed quietly. Named so the gap cannot be mistaken for accounted-for
 * work: the **11 cases upstream carried at 0.2.0** — centring on both axes and
 * on each axis alone, `height`, `width`, both together, `isInline`, `ref`,
 * `xstyle`, prop pass-through, and rendering as a `div`.
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

/**
 * The functional class output, as an order-insensitive set. Upstream's helper
 * verbatim, and it earns its keep here for the same reason: StyleX's dev
 * runtime also emits readable debug classes naming the style object a
 * declaration came from (`padding__paddingBlockStyles.2`), and those record
 * provenance rather than applied CSS — they survive even when the declaration
 * they name loses a merge. The port's root also carries `themeProps`' marker
 * class, but both sides of every comparison below render the same `axis`, so it
 * cancels rather than needing a filter of its own.
 */
function classSet(el: Element): Set<string> {
	return new Set(
		el.className
			.split(' ')
			.filter(Boolean)
			.filter((c) => !c.includes('__') && !c.includes('.'))
	);
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
	it('applies a class when paddingBlockStart is set on its own', async () => {
		const screen = await renderCenter({ 'data-testid': 'center' });
		const baseline = screen.getByTestId('center').element().className;
		await screen.rerender({ rest: { paddingBlockStart: 2, 'data-testid': 'center' } });
		expect(screen.getByTestId('center').element().className).not.toBe(baseline);
	});

	it('lets paddingBlockStart/paddingBlockEnd override only their own edge', async () => {
		// padding={4} + paddingBlockStart={2} must equal spelling every edge out:
		// both inline edges and the block-end edge stay at 4.
		const screen = await renderCenter({
			padding: 4,
			paddingBlockStart: 2,
			'data-testid': 'center'
		});
		const perEdge = classSet(screen.getByTestId('center').element());
		await screen.rerender({
			rest: {
				paddingInline: 4,
				paddingBlockStart: 2,
				paddingBlockEnd: 4,
				'data-testid': 'center'
			}
		});
		expect(perEdge).toEqual(classSet(screen.getByTestId('center').element()));
	});

	it('gives paddingBlockEnd precedence over paddingBlock', async () => {
		const screen = await renderCenter({
			paddingBlock: 6,
			paddingBlockEnd: 0,
			'data-testid': 'center'
		});
		const overridden = classSet(screen.getByTestId('center').element());
		await screen.rerender({
			rest: { paddingBlockStart: 6, paddingBlockEnd: 0, 'data-testid': 'center' }
		});
		expect(overridden).toEqual(classSet(screen.getByTestId('center').element()));
	});

	it('leaves padding/paddingBlock output unchanged when no edge prop is set', async () => {
		const screen = await renderCenter({ padding: 3, 'data-testid': 'center' });
		const uniform = classSet(screen.getByTestId('center').element());
		await screen.rerender({
			rest: { paddingInline: 3, paddingBlock: 3, 'data-testid': 'center' }
		});
		expect(uniform).toEqual(classSet(screen.getByTestId('center').element()));
	});

	it('applies a class when paddingInlineStart is set on its own', async () => {
		const screen = await renderCenter({ 'data-testid': 'center' });
		const baseline = screen.getByTestId('center').element().className;
		await screen.rerender({ rest: { paddingInlineStart: 2, 'data-testid': 'center' } });
		expect(screen.getByTestId('center').element().className).not.toBe(baseline);
	});

	it('lets paddingInlineStart/paddingInlineEnd override only their own edge', async () => {
		const screen = await renderCenter({
			padding: 4,
			paddingInlineStart: 2,
			'data-testid': 'center'
		});
		const perEdge = classSet(screen.getByTestId('center').element());
		await screen.rerender({
			rest: {
				paddingInlineStart: 2,
				paddingInlineEnd: 4,
				paddingBlock: 4,
				'data-testid': 'center'
			}
		});
		expect(perEdge).toEqual(classSet(screen.getByTestId('center').element()));
	});

	it('gives paddingInlineEnd precedence over paddingInline', async () => {
		const screen = await renderCenter({
			paddingInline: 6,
			paddingInlineEnd: 0,
			'data-testid': 'center'
		});
		const overridden = classSet(screen.getByTestId('center').element());
		await screen.rerender({
			rest: { paddingInlineStart: 6, paddingInlineEnd: 0, 'data-testid': 'center' }
		});
		expect(overridden).toEqual(classSet(screen.getByTestId('center').element()));
	});

	it('resolves all four edges independently', async () => {
		// One prop per edge, each a different step: the four-edge spelling and the
		// shorthand-plus-overrides spelling must agree.
		const screen = await renderCenter({
			paddingInlineStart: 1,
			paddingInlineEnd: 2,
			paddingBlockStart: 3,
			paddingBlockEnd: 4,
			'data-testid': 'center'
		});
		const explicit = classSet(screen.getByTestId('center').element());
		await screen.rerender({
			rest: {
				padding: 4,
				paddingInlineStart: 1,
				paddingInlineEnd: 2,
				paddingBlockStart: 3,
				'data-testid': 'center'
			}
		});
		expect(explicit).toEqual(classSet(screen.getByTestId('center').element()));
	});
});
