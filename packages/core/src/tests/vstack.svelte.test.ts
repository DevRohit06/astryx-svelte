import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import VStack from '$lib/components/stack/vstack.svelte';
import StackProbe from './fixtures/stack-probe.svelte';

/**
 * Astryx's `VStack/VStack.test.tsx` at the **0.4.5** pin — upstream declares
 * **12** `it`s and **12** are here. Nothing is dropped.
 *
 * Two translations, neither of them a dropped case:
 *
 * - **Children go through `stack-probe.svelte`.** Upstream writes
 *   `<div>Item 1</div><div>Item 2</div>` inline; `children` is a `Snippet` here
 *   and a snippet can only be authored in a template. The probe renders the
 *   `VStack` at its own top level, so `screen.container.firstChild` is the
 *   stack root that upstream's alias cases assert on.
 * - **`forwards ref correctly` / `forwards ref with polymorphic as` become the
 *   attachment counterpart.** `VStack` forwards its rest props to `Stack`,
 *   which spreads them onto its root `<svelte:element>`, so an attachment
 *   travels the same two hops upstream's `ref` does.
 *
 * Upstream's three alias cases assert only `expect(container.firstChild)
 * .toBeInTheDocument()`; that is weak but it is a real, running assertion, so
 * it is kept rather than invented over. They read `container.firstElementChild`
 * here: Svelte's client renderer emits an anchor comment before a component's
 * markup, so `firstChild` is a `Comment` and jest-dom rejects it outright, while
 * `firstElementChild` is the very node upstream's `firstChild` refers to.
 */

/** Renders a `VStack` through the probe: `rest` are its props, `items`/`text` its children. */
function renderVStack(
	rest: Record<string | symbol, unknown>,
	children: { items?: string[]; text?: string } = {}
) {
	return render(StackProbe, { props: { component: VStack, rest, ...children } });
}

describe('VStack', () => {
	it('renders children correctly', async () => {
		const screen = await renderVStack({}, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
		await expect.element(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('renders as div by default', async () => {
		const screen = await renderVStack({ 'data-testid': 'vstack' }, { text: 'Content' });
		const element = screen.getByTestId('vstack').element();
		expect(element.tagName).toBe('DIV');
	});

	it('renders with polymorphic as prop', async () => {
		const screen = await renderVStack({ as: 'main', 'data-testid': 'vstack' }, { text: 'Content' });
		const element = screen.getByTestId('vstack').element();
		expect(element.tagName).toBe('MAIN');
	});

	it('renders with gap prop', async () => {
		const screen = await renderVStack({ gap: 4 }, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('renders with hAlign prop', async () => {
		const screen = await renderVStack({ hAlign: 'center' }, { items: ['Item 1'] });
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('renders with wrap prop', async () => {
		const screen = await renderVStack({ wrap: 'wrap' }, { items: ['Item 1', 'Item 2'] });
		await expect.element(screen.getByText('Item 1')).toBeInTheDocument();
	});

	it('forwards ref correctly', async () => {
		// Counterpart: an attachment in the rest props travels VStack → Stack →
		// root element, which is the hop upstream's callback `ref` makes.
		const attached = vi.fn();
		const screen = await renderVStack(
			{ [createAttachmentKey()]: (node: Element) => attached(node) },
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('forwards ref with polymorphic as', async () => {
		const attached = vi.fn();
		const screen = await renderVStack(
			{ as: 'section', [createAttachmentKey()]: (node: Element) => attached(node) },
			{ items: ['Test'] }
		);
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLElement);
	});

	it('passes through additional props', async () => {
		const screen = await renderVStack({ 'data-testid': 'vstack' }, { items: ['Item'] });
		await expect.element(screen.getByTestId('vstack')).toBeInTheDocument();
	});

	it('accepts justify as alias for vAlign', async () => {
		const screen = await renderVStack({ justify: 'center' }, { items: ['A'] });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('accepts align as alias for hAlign', async () => {
		const screen = await renderVStack({ align: 'center' }, { items: ['A'] });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});

	it('prefers explicit vAlign over justify', async () => {
		const screen = await renderVStack({ vAlign: 'center', justify: 'end' }, { items: ['A'] });
		expect(screen.container.firstElementChild).toBeInTheDocument();
	});
});
