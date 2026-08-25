import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import StackItem from '$lib/components/stack/stack-item.svelte';
import StackProbe from './fixtures/stack-probe.svelte';

/**
 * Astryx's `Stack/StackItem.test.tsx` at the **0.5.0** pin — upstream declares
 * **11** `it`s and **11** are here. Nothing is dropped.
 *
 * Two translations, neither of them a dropped case:
 *
 * - **Children go through `stack-probe.svelte`.** `children` is a `Snippet`
 *   here, and a snippet can only be authored in a template; the probe renders
 *   the `StackItem` at its own top level so nothing is interposed.
 * - **`forwards ref correctly` / `forwards ref with polymorphic as` become the
 *   attachment counterpart.** Svelte has no `ref` prop; `StackItem`
 *   rest-spreads onto its root `<svelte:element>`, so an attachment in the rest
 *   props reaches the element upstream's callback ref receives. Upstream's
 *   `expect.any(HTMLDivElement)` / `expect.any(HTMLElement)` survive as
 *   `toBeInstanceOf` on the element that actually arrived.
 *
 * `rerender` merges the probe's props, and `rest` is one of them — passing a
 * fresh `rest` object replaces the target's props wholesale.
 */

/** Renders a `StackItem` through the probe: `rest` are its props, `items`/`text` its children. */
function renderStackItem(
	rest: Record<string | symbol, unknown>,
	children: { items?: string[]; text?: string } = {}
) {
	return render(StackProbe, { props: { component: StackItem, rest, ...children } });
}

describe('StackItem', () => {
	it('renders children correctly', async () => {
		const screen = await renderStackItem({}, { text: 'Test content' });
		await expect.element(screen.getByText('Test content', { exact: true })).toBeInTheDocument();
	});

	it('renders as div by default', async () => {
		const screen = await renderStackItem({ 'data-testid': 'stack-item' }, { text: 'Content' });
		const element = screen.getByTestId('stack-item').element();
		expect(element.tagName).toBe('DIV');
	});

	it('renders with polymorphic as prop', async () => {
		const screen = await renderStackItem(
			{ as: 'section', 'data-testid': 'stack-item' },
			{ text: 'Content' }
		);
		const element = screen.getByTestId('stack-item').element();
		expect(element.tagName).toBe('SECTION');
	});

	it('renders with size prop', async () => {
		const screen = await renderStackItem({ size: 'fill' }, { text: 'Content' });
		await expect.element(screen.getByText('Content', { exact: true })).toBeInTheDocument();
	});

	it('renders with static size', async () => {
		const screen = await renderStackItem({ size: 'static' }, { text: 'Content' });
		await expect.element(screen.getByText('Content', { exact: true })).toBeInTheDocument();
	});

	it('renders with crossAlignSelf prop', async () => {
		const screen = await renderStackItem({ crossAlignSelf: 'center' }, { text: 'Content' });
		await expect.element(screen.getByText('Content', { exact: true })).toBeInTheDocument();
	});

	it('forwards ref correctly', async () => {
		// Counterpart: an attachment in the rest props reaches the same root
		// element upstream's callback `ref` is handed.
		const attached = vi.fn();
		const screen = await renderStackItem(
			{ [createAttachmentKey()]: (node: Element) => attached(node) },
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLDivElement);
	});

	it('forwards ref with polymorphic as', async () => {
		const attached = vi.fn();
		const screen = await renderStackItem(
			{ as: 'section', [createAttachmentKey()]: (node: Element) => attached(node) },
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('passes through additional props', async () => {
		const screen = await renderStackItem(
			{ 'data-testid': 'stack-item', 'aria-label': 'Stack item' },
			{ text: 'Content' }
		);
		const element = screen.getByTestId('stack-item');
		await expect.element(element).toHaveAttribute('aria-label', 'Stack item');
	});

	it('applies an overflow class when isScrollable is set', async () => {
		const screen = await renderStackItem({ 'data-testid': 'stack-item' }, { text: 'Content' });
		const withoutScroll = screen.getByTestId('stack-item').element().className;
		await screen.rerender({ rest: { isScrollable: true, 'data-testid': 'stack-item' } });
		const withScroll = screen.getByTestId('stack-item').element().className;
		expect(withScroll).not.toBe(withoutScroll);
	});

	it('composes isScrollable with size="fill"', async () => {
		const screen = await renderStackItem(
			{ size: 'fill', isScrollable: true, 'data-testid': 'stack-item' },
			{ text: 'Content' }
		);
		expect(screen.getByTestId('stack-item').element().className).not.toBe('');
	});
});
