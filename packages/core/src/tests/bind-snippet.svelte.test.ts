import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { bindCellSnippet, bindSnippet } from '$lib/internal/bind-snippet.js';
import BindSnippetFixture, {
	cell,
	greet,
	type CellArg,
	type GreetArg
} from './fixtures/bind-snippet-fixture.svelte';

/**
 * **Beyond upstream.** `bindSnippet` is a mechanism with no React analogue —
 * React closes over per-cell data in JSX, so upstream's plugin suites have
 * nothing that corresponds. It underpins five of the batch-13 plugins
 * (`sortable`, `columnResize`, `filtering`, `tree`, `rowExpansion`), and every
 * one of its failure modes is silent: the slot renders blank, or renders once
 * and stops tracking.
 *
 * The client half lives here; `bind-snippet-ssr.test.ts` runs the same fixture
 * through the server compile target, which is the half that actually differs
 * (snippet parameters arrive as values there, as getters here).
 */
describe('bindSnippet (client)', () => {
	it('renders a bound argument', async () => {
		const screen = await render(BindSnippetFixture, {
			props: { bound: bindSnippet<GreetArg>(greet, () => ({ name: 'Alice', count: 1 })) }
		});

		await expect.element(screen.getByTestId('greeting')).toHaveTextContent('Alice:1');
	});

	it('re-reads the getter when its source changes', async () => {
		let count = $state(1);
		const screen = await render(BindSnippetFixture, {
			props: { bound: bindSnippet<GreetArg>(greet, () => ({ name: 'Alice', count })) }
		});

		await expect.element(screen.getByTestId('greeting')).toHaveTextContent('Alice:1');

		count = 7;
		// The bound snippet holds the getter, not a snapshot — the update has to
		// reach the DOM without the snippet being rebound.
		await expect.element(screen.getByTestId('greeting')).toHaveTextContent('Alice:7');
	});

	it('renders two bindings of the same snippet independently', async () => {
		const first = await render(BindSnippetFixture, {
			props: { bound: bindSnippet<GreetArg>(greet, () => ({ name: 'A', count: 1 })) }
		});
		const second = await render(BindSnippetFixture, {
			props: { bound: bindSnippet<GreetArg>(greet, () => ({ name: 'B', count: 2 })) }
		});

		// Scoped by container: both fixtures mount into the same document, so a
		// page-level locator is a strict-mode violation rather than a failure.
		expect(first.container.querySelector('[data-testid="greeting"]')).toHaveTextContent('A:1');
		expect(second.container.querySelector('[data-testid="greeting"]')).toHaveTextContent('B:2');
	});
});

/**
 * `bindCellSnippet` is the row-folding variant, and the one `TableColumn.renderCell`
 * needs: the slot keeps a row parameter open, so the binder folds that row into
 * the same single object argument rather than opening a second parameter.
 *
 * `rowExpansion` and `tree` each invented this independently before it was
 * promoted to `internal/`; these cases are what stop the two shapes drifting
 * apart again.
 */
describe('bindCellSnippet (client)', () => {
	it('folds the row into the bound argument', async () => {
		const screen = await render(BindSnippetFixture, {
			props: {
				boundCell: bindCellSnippet<{ name: string }, CellArg>(cell, (item) => ({
					label: 'Name',
					item
				})),
				item: { name: 'Alice' }
			}
		});

		await expect.element(screen.getByTestId('cell')).toHaveTextContent('Name/Alice');
	});

	it('re-reads the row when the caller passes a new one', async () => {
		let item = $state({ name: 'Alice' });
		const screen = await render(BindSnippetFixture, {
			props: {
				boundCell: bindCellSnippet<{ name: string }, CellArg>(cell, (row) => ({
					label: 'Name',
					item: row
				})),
				get item() {
					return item;
				}
			}
		});

		await expect.element(screen.getByTestId('cell')).toHaveTextContent('Name/Alice');

		item = { name: 'Bob' };
		// The row is read lazily inside the bound getter, so a new row must reach
		// the DOM without the snippet being rebound.
		await expect.element(screen.getByTestId('cell')).toHaveTextContent('Name/Bob');
	});
});
