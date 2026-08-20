import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import Stack from '$lib/components/stack/stack.svelte';
import StackProbe from './fixtures/stack-probe.svelte';

/**
 * Astryx's `Stack/Stack.test.tsx` at the **0.4.5** pin — upstream declares
 * **30** `it`s and **30** are here. Nothing is dropped.
 *
 * Four translations, none of them a dropped case:
 *
 * - **Children go through `stack-probe.svelte`.** Upstream writes
 *   `<div>Item 1</div><div>Item 2</div>` inline; `children` is a `Snippet` here
 *   and a snippet can only be authored in a template. The probe renders the
 *   target at its own top level, so nothing is interposed above the stack root.
 * - **The four alias cases read `container.firstElementChild`, not
 *   `container.firstChild`.** Svelte's client renderer emits an anchor comment
 *   before a component's markup, so `firstChild` is a `Comment` and jest-dom
 *   rejects it outright — the same node upstream means by `firstChild` is
 *   `firstElementChild` here. The assertion itself is upstream's, unchanged.
 * - **`forwards ref correctly` / `forwards ref with polymorphic as` become the
 *   attachment counterpart.** Svelte has no `ref` prop; `Stack` rest-spreads
 *   onto its root `<svelte:element>`, so an attachment in the rest props reaches
 *   the element upstream's callback ref receives. The counterpart checks more
 *   than upstream's does — it asserts *which* element arrived, not merely that
 *   the callback ran.
 * - **The three string-sizing cases are restated.** Upstream runs under jsdom,
 *   whose `getComputedStyle` echoes the declaration back, so
 *   `toHaveStyle({width: '100%'})` matches. In a real Chromium the CSSOM
 *   resolves `%` and `vh` on a rendered element to used pixels, so that matcher
 *   can never see `'100%'` or `'50vh'` and the case would fail for a reason that
 *   has nothing to do with `Stack`. The inline declaration is asserted instead,
 *   which is exactly what "as-is" claims. The two numeric cases keep
 *   `toHaveStyle` verbatim, since `300px` survives the resolution unchanged.
 *
 * `rerender` merges the probe's props, and `rest` is one of them — passing a
 * fresh `rest` object replaces the target's props wholesale, which is what
 * upstream's re-render with different props does.
 */

/** Renders a `Stack` through the probe: `rest` are its props, `items`/`text` its children. */
function renderStack(
	rest: Record<string | symbol, unknown>,
	children: { items?: string[]; text?: string } = {}
) {
	return render(StackProbe, { props: { component: Stack, rest, ...children } });
}

describe('Stack', () => {
	it('defaults to vertical direction', async () => {
		const screen = await renderStack({ 'data-testid': 'stack' }, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByTestId('stack')).toBeInTheDocument();
	});

	it('renders children correctly', async () => {
		const screen = await renderStack({ direction: 'vertical' }, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('renders as div by default', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', 'data-testid': 'stack' },
			{ text: 'Content' }
		);
		const element = screen.getByTestId('stack').element();
		expect(element.tagName).toBe('DIV');
	});

	it('renders with horizontal direction', async () => {
		const screen = await renderStack(
			{ direction: 'horizontal', 'data-testid': 'stack' },
			{ items: ['Item 1', 'Item 2'] }
		);
		await expect.element(screen.getByTestId('stack')).toBeInTheDocument();
	});

	it('renders with vertical direction', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', 'data-testid': 'stack' },
			{ items: ['Item 1', 'Item 2'] }
		);
		await expect.element(screen.getByTestId('stack')).toBeInTheDocument();
	});

	it('renders with polymorphic as prop', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', as: 'nav', 'data-testid': 'stack' },
			{ text: 'Content' }
		);
		const element = screen.getByTestId('stack').element();
		expect(element.tagName).toBe('NAV');
	});

	it('renders with polymorphic as section', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', as: 'section', 'data-testid': 'stack' },
			{ text: 'Content' }
		);
		const element = screen.getByTestId('stack').element();
		expect(element.tagName).toBe('SECTION');
	});

	it('renders with gap prop', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', gap: 4 },
			{ items: ['Item 1', 'Item 2'] }
		);
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('renders with hAlign prop', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', hAlign: 'center' },
			{
				items: ['Item 1']
			}
		);
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('renders with vAlign prop', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', vAlign: 'center' },
			{
				items: ['Item 1']
			}
		);
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('renders with wrap prop', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', wrap: 'wrap' },
			{ items: ['Item 1', 'Item 2'] }
		);
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('renders horizontal with hAlign and vAlign', async () => {
		const screen = await renderStack(
			{ direction: 'horizontal', hAlign: 'between', vAlign: 'center' },
			{ items: ['Item 1', 'Item 2'] }
		);
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('renders vertical with hAlign and vAlign', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', hAlign: 'center', vAlign: 'between' },
			{ items: ['Item 1', 'Item 2'] }
		);
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('forwards ref correctly', async () => {
		// Counterpart: an attachment in the rest props reaches the same root
		// element upstream's callback `ref` is handed.
		const attached = vi.fn();
		const screen = await renderStack(
			{
				direction: 'vertical',
				[createAttachmentKey()]: (node: Element) => attached(node)
			},
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('forwards ref with polymorphic as', async () => {
		const attached = vi.fn();
		const screen = await renderStack(
			{
				direction: 'vertical',
				as: 'section',
				[createAttachmentKey()]: (node: Element) => attached(node)
			},
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('passes through additional props', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', 'data-testid': 'stack', 'aria-label': 'Stack container' },
			{ items: ['Item'] }
		);
		const element = screen.getByTestId('stack');
		await expect.element(element).toHaveAttribute('aria-label', 'Stack container');
	});

	it('accepts justify as main-axis alias (horizontal)', async () => {
		const screen = await renderStack(
			{ direction: 'horizontal', justify: 'between' },
			{ items: ['A', 'B'] }
		);
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('accepts align as cross-axis alias (horizontal)', async () => {
		const screen = await renderStack(
			{ direction: 'horizontal', align: 'center' },
			{
				items: ['A']
			}
		);
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('accepts justify as main-axis alias (vertical)', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', justify: 'center' },
			{
				items: ['A']
			}
		);
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('prefers explicit hAlign/vAlign over aliases', async () => {
		const screen = await renderStack(
			{ direction: 'horizontal', hAlign: 'center', justify: 'end' },
			{ items: ['A'] }
		);
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('applies numeric width as pixels', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', width: 300, 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		await expect.element(screen.getByTestId('stack')).toHaveStyle({ width: '300px' });
	});

	it('applies string width as-is', async () => {
		// Restated: a real browser resolves `width: 100%` to used pixels in
		// `getComputedStyle`, which is what `toHaveStyle` reads. The declaration
		// is where "as-is" is observable.
		const screen = await renderStack(
			{ direction: 'vertical', width: '100%', 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		expect((screen.getByTestId('stack').element() as HTMLElement).style.width).toBe('100%');
	});

	it('applies numeric height as pixels', async () => {
		const screen = await renderStack(
			{ direction: 'horizontal', height: 200, 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		await expect.element(screen.getByTestId('stack')).toHaveStyle({ height: '200px' });
	});

	it('applies string height as-is', async () => {
		// Restated for the same reason as the width case above: `50vh` resolves
		// to pixels in a real browser's computed style.
		const screen = await renderStack(
			{ direction: 'horizontal', height: '50vh', 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		expect((screen.getByTestId('stack').element() as HTMLElement).style.height).toBe('50vh');
	});

	it('applies both width and height together', async () => {
		const screen = await renderStack(
			{ direction: 'vertical', width: 400, height: '100%', 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		const el = screen.getByTestId('stack');
		await expect.element(el).toHaveStyle({ width: '400px' });
		// The `100%` half is restated, as above.
		expect((el.element() as HTMLElement).style.height).toBe('100%');
	});

	it('applies a class when padding is set', async () => {
		const screen = await renderStack({ padding: 3, 'data-testid': 'stack' }, { items: ['Item'] });
		expect(screen.getByTestId('stack').element().className).not.toBe('');
	});

	it('accepts paddingInline and paddingBlock without error', async () => {
		const screen = await renderStack(
			{ paddingInline: 4, paddingBlock: 2, 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		await expect.element(screen.getByTestId('stack')).toBeInTheDocument();
	});

	it('lets paddingInline/paddingBlock override padding on their axis', async () => {
		// padding sets both axes; paddingInline overrides the inline axis. The
		// component should render without conflict and carry a class.
		const screen = await renderStack(
			{ padding: 2, paddingInline: 5, 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		expect(screen.getByTestId('stack').element().className).not.toBe('');
	});

	it('applies a class when isScrollable is set', async () => {
		const screen = await renderStack(
			{ isScrollable: true, 'data-testid': 'stack' },
			{ items: ['Item'] }
		);
		expect(screen.getByTestId('stack').element().className).not.toBe('');
	});

	it('does not set overflow class when isScrollable is false', async () => {
		const screen = await renderStack({ 'data-testid': 'stack' }, { items: ['Item'] });
		const withoutScroll = screen.getByTestId('stack').element().className;
		await screen.rerender({ rest: { isScrollable: true, 'data-testid': 'stack' } });
		const withScroll = screen.getByTestId('stack').element().className;
		expect(withScroll).not.toBe(withoutScroll);
	});
});
