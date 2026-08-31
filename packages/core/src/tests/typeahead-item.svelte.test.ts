import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TypeaheadItem from '$lib/components/typeahead/typeahead-item.svelte';

/**
 * Astryx's `Typeahead/TypeaheadItem.test.tsx`, ported case for case — **all 2 of
 * upstream's declarations at the 0.5.2 pin**, in upstream's order and under its
 * titles. Nothing dropped.
 *
 * The suite arrived new at 0.5.1 alongside the `BaseProps` pass-through fix
 * ("Seven components now forward the pass-through props promised by
 * `BaseProps`"), which is exactly what both cases pin.
 *
 * ## Project
 *
 * The **client** project: both cases assert on rendered DOM attributes and on
 * the merged `class`, so they need a real element rather than the node
 * environment.
 *
 * Standing translations:
 *
 * - `render(<TypeaheadItem … />)` is `render(TypeaheadItem, { props })`, and
 *   `screen.getByTestId` is the returned locator's `getByTestId`.
 * - Upstream's `className` prop is `class` here — Svelte's own attribute — and
 *   `item.className` is read off `.element()`.
 */
describe('TypeaheadItem', () => {
	it('forwards pass-through props to the item element', async () => {
		const screen = render(TypeaheadItem, {
			props: {
				item: { id: '1', label: 'Alice' },
				'aria-label': 'Alice, engineer',
				id: 'result-1',
				'data-source': 'directory',
				'data-testid': 'item'
			}
		});
		const item = screen.getByTestId('item');
		await expect.element(item).toHaveAttribute('aria-label', 'Alice, engineer');
		await expect.element(item).toHaveAttribute('id', 'result-1');
		await expect.element(item).toHaveAttribute('data-source', 'directory');
	});

	it('merges a caller className with its own classes', async () => {
		const screen = render(TypeaheadItem, {
			props: {
				item: { id: '1', label: 'Alice' },
				class: 'caller-class',
				'data-testid': 'item'
			}
		});
		const item = screen.getByTestId('item');
		await expect.element(item).toBeInTheDocument();
		expect(item.element().className).toContain('caller-class');
		expect(item.element().className).toContain('astryx-typeahead-item');
	});
});
