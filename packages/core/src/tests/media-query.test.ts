/** PORTS: hooks/useMediaQuery.test.ts */

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Probe from './fixtures/media-query-probe.svelte';

/**
 * The two SSR cases from Astryx's `hooks/useMediaQuery.test.ts` at the **0.5.0**
 * pin — upstream's `SSR: returns serverDefault=true in server render` and
 * `SSR: returns false when no serverDefault provided`, which are the two that
 * call `renderToString`. They live in the node project rather than beside the
 * browser cases because that is where a server render happens —
 * `svelte/server`'s `render` is this port's `renderToString`.
 *
 * The count is the contract, and the suite is split across two files, so
 * neither states the whole of it: upstream declares **10** cases at this pin,
 * **2** are here, and the other **8** are in `media-query.svelte.test.ts`.
 * Nothing is dropped. The `SSR: ` title prefix is carried by this file's
 * describe instead, which is why the titles here read without it.
 *
 * These pin down the half of the hook a browser test cannot see: `$effect.pre`
 * never runs on the server, so `serverDefault` is what the markup carries. That
 * is upstream's `getServerSnapshot`, and the reason `useSyncExternalStore` takes
 * a third argument at all.
 */

describe('useMediaQuery (SSR)', () => {
	it('returns serverDefault=true in server render', () => {
		const { body } = render(Probe, {
			props: { query: '(max-width: 768px)', serverDefault: true }
		});
		expect(body).toContain('>true<');
	});

	it('returns false when no serverDefault provided', () => {
		const { body } = render(Probe, { props: { query: '(max-width: 768px)' } });
		expect(body).toContain('>false<');
	});
});
