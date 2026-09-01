/** PORTS: HStack/HStack.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import HStack from '$lib/components/stack/hstack.svelte';
import StackProbe from './fixtures/stack-probe.svelte';

/**
 * Astryx's `HStack/HStack.test.tsx` at the **0.5.0** pin — upstream declares
 * **12** `it`s and **12** are here. Nothing is dropped.
 *
 * Two translations, neither of them a dropped case:
 *
 * - **Children go through `stack-probe.svelte`.** Upstream writes
 *   `<div>Item 1</div><div>Item 2</div>` inline; `children` is a `Snippet` here
 *   and a snippet can only be authored in a template. The probe renders the
 *   `HStack` at its own top level, so `screen.container.firstChild` is the
 *   stack root that upstream's alias cases assert on.
 * - **`forwards ref correctly` / `forwards ref with polymorphic as` become the
 *   attachment counterpart.** `HStack` forwards its rest props to `Stack`,
 *   which spreads them onto its root `<svelte:element>`, so an attachment
 *   travels the same two hops upstream's `ref` does — which is the part of
 *   these two cases worth keeping.
 *
 * Upstream's three alias cases assert only `expect(container.firstChild)
 * .toBeInTheDocument()`; that is weak but it is a real, running assertion, so
 * it is kept rather than invented over. They read `container.firstElementChild`
 * here: Svelte's client renderer emits an anchor comment before a component's
 * markup, so `firstChild` is a `Comment` and jest-dom rejects it outright, while
 * `firstElementChild` is the very node upstream's `firstChild` refers to.
 */

/** Renders an `HStack` through the probe: `rest` are its props, `items`/`text` its children. */
function renderHStack(
	rest: Record<string | symbol, unknown>,
	children: { items?: string[]; text?: string } = {}
) {
	return render(StackProbe, { props: { component: HStack, rest, ...children } });
}

describe('HStack', () => {
	it('renders children correctly', async () => {
		const screen = await renderHStack({}, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2', { exact: true })).toBeInTheDocument();
	});

	it('renders as div by default', async () => {
		const screen = await renderHStack({ 'data-testid': 'hstack' }, { text: 'Content' });
		const element = screen.getByTestId('hstack').element();
		expect(element.tagName).toBe('DIV');
	});

	it('renders with polymorphic as prop', async () => {
		const screen = await renderHStack({ as: 'nav', 'data-testid': 'hstack' }, { text: 'Content' });
		const element = screen.getByTestId('hstack').element();
		expect(element.tagName).toBe('NAV');
	});

	it('renders with gap prop', async () => {
		const screen = await renderHStack({ gap: 4 }, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
	});

	it('renders with vAlign prop', async () => {
		const screen = await renderHStack({ vAlign: 'center' }, { items: ['Item 1'] });
		await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
	});

	it('renders with wrap prop', async () => {
		const screen = await renderHStack({ wrap: 'wrap' }, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
	});

	it('forwards ref correctly', async () => {
		// Counterpart: an attachment in the rest props travels HStack → Stack →
		// root element, which is the hop upstream's callback `ref` makes.
		const attached = vi.fn();
		const screen = await renderHStack(
			{ [createAttachmentKey()]: (node: Element) => attached(node) },
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('forwards ref with polymorphic as', async () => {
		const attached = vi.fn();
		const screen = await renderHStack(
			{ as: 'section', [createAttachmentKey()]: (node: Element) => attached(node) },
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('passes through additional props', async () => {
		const screen = await renderHStack({ 'data-testid': 'hstack' }, { items: ['Item'] });
		await expect.element(screen.getByTestId('hstack')).toBeInTheDocument();
	});

	it('accepts justify as alias for hAlign', async () => {
		const screen = await renderHStack({ justify: 'between' }, { items: ['A', 'B'] });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('accepts align as alias for vAlign', async () => {
		const screen = await renderHStack({ align: 'center' }, { items: ['A'] });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('prefers explicit hAlign over justify', async () => {
		const screen = await renderHStack({ hAlign: 'center', justify: 'end' }, { items: ['A'] });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});
});
