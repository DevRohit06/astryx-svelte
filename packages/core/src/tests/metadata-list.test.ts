/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Harness from './fixtures/metadata-list-harness.svelte';

/**
 * The server half of `MetadataList`'s `maxNumOfItems`, which has no upstream
 * counterpart because upstream needs none: React slices `children` before
 * rendering anything, so its cut is server-side by construction.
 *
 * Ours counts items as they render, and the property worth pinning is that the
 * count is still final in time — the cut and the "Show more" toggle are both in
 * the server-rendered HTML rather than appearing after hydration. The first
 * implementation read the count through a `$derived` and failed exactly this,
 * because a derived is computed once per server render and cached: the first
 * item read it when the count was 1, and every later item saw that stale answer.
 *
 * These run in the node project against `svelte/server`, which is the only place
 * the difference is observable — `media-query.test.ts` is here for the same
 * reason.
 */
describe('MetadataList under SSR', () => {
	const items: [string, string][] = [
		['A', '1'],
		['B', '2'],
		['C', '3'],
		['D', '4']
	];

	it('cuts items past maxNumOfItems during the server pass', () => {
		const { body } = render(Harness, { props: { items, maxNumOfItems: 2 } });
		expect((body.match(/<dt/g) ?? []).length).toBe(2);
		expect(body).not.toContain('>3<');
	});

	it('renders the toggle during the server pass', () => {
		const { body } = render(Harness, { props: { items, maxNumOfItems: 2 } });
		expect(body).toContain('Show more');
	});

	it('renders every item and no toggle when the count is within the max', () => {
		const { body } = render(Harness, { props: { items, maxNumOfItems: 4 } });
		expect((body.match(/<dt/g) ?? []).length).toBe(4);
		expect(body).not.toContain('Show more');
	});

	it('ignores maxNumOfItems in horizontal orientation', () => {
		const { body } = render(Harness, {
			props: { items, maxNumOfItems: 1, orientation: 'horizontal' }
		});
		expect((body.match(/<dt/g) ?? []).length).toBe(4);
		expect(body).not.toContain('Show more');
	});
});
