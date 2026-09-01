/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { bindCellSnippet, bindSnippet } from '$lib/internal/bind-snippet.js';
import BindSnippetFixture, {
	cell,
	greet,
	type CellArg,
	type GreetArg
} from './fixtures/bind-snippet-fixture.svelte';

/**
 * **Beyond upstream**, and the half that matters most — see the header of
 * `bind-snippet.svelte.test.ts` for why the mechanism exists at all.
 *
 * Svelte compiles snippet parameters differently per target: getters on the
 * client, plain values on the server. `bindSnippet` always passes the getter,
 * and `unwrapSlotArg` in the snippet body absorbs the difference. Nothing in
 * the client project can catch a regression in the server branch, and a
 * regression there is invisible in development — an SSR'd table would render
 * `[object Function]` into a header, or nothing at all.
 *
 * Mutation-checked: changing `unwrapSlotArg` to `return arg as A` (dropping the
 * function test) makes the first case emit the stringified getter instead of
 * `Alice:1`, and leaves `bind-snippet.svelte.test.ts` fully green.
 */
describe('bindSnippet — SSR', () => {
	it('resolves the bound argument in server markup', () => {
		const { body } = render(BindSnippetFixture, {
			props: { bound: bindSnippet<GreetArg>(greet, () => ({ name: 'Alice', count: 1 })) }
		});

		expect(body).toMatch(/<span[^>]*data-testid="greeting"[^>]*>Alice:1<\/span>/);
	});

	it('does not leak the getter into the markup', () => {
		const { body } = render(BindSnippetFixture, {
			props: { bound: bindSnippet<GreetArg>(greet, () => ({ name: 'Bob', count: 2 })) }
		});

		expect(body).not.toMatch(/function|=>/);
		expect(body).toContain('Bob:2');
	});
});

/**
 * The row-folding binder on the server. These two cases pin the *server* half
 * of the contract — that a bound cell still renders its row when there is no
 * getter anywhere in the chain.
 *
 * **Which target catches a broken fold is the opposite of the `bindSnippet`
 * case above, and that is worth stating because it is counter-intuitive.**
 * `unwrapSlotArg` inside `bindCellSnippet` normalises the *incoming row*, which
 * is a getter on the client and a plain value on the server — so dropping it is
 * a no-op here and a defect there. Mutation-checked by actually running it:
 * folding `item` straight in leaves all four of these cases green and fails
 * both `bindCellSnippet (client)` cases with `Name/getter`. The two files are
 * therefore not redundant in either direction — `bindSnippet`'s guard is caught
 * only by SSR, `bindCellSnippet`'s only by the client.
 */
describe('bindCellSnippet — SSR', () => {
	it('folds the row into the bound argument in server markup', () => {
		const { body } = render(BindSnippetFixture, {
			props: {
				boundCell: bindCellSnippet<{ name: string }, CellArg>(cell, (item) => ({
					label: 'Name',
					item
				})),
				item: { name: 'Alice' }
			}
		});

		expect(body).toMatch(/<span[^>]*data-testid="cell"[^>]*>Name\/Alice<\/span>/);
	});

	it('does not leak the row getter into the markup', () => {
		const { body } = render(BindSnippetFixture, {
			props: {
				boundCell: bindCellSnippet<{ name: string }, CellArg>(cell, (item) => ({
					label: 'Name',
					item
				})),
				item: { name: 'Bob' }
			}
		});

		expect(body).not.toMatch(/function|=>|\[object/);
		expect(body).toContain('Name/Bob');
	});
});
