import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Probe from './fixtures/media-query-probe.svelte';

/**
 * The two SSR cases from Astryx's `hooks/useMediaQuery.test.ts`, which are the
 * ones that call `renderToString`. They live in the node project rather than
 * beside the browser cases because that is where a server render happens —
 * `svelte/server`'s `render` is this port's `renderToString`.
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
