import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/image-mode-probe.svelte';

/**
 * Ported from Astryx's `hooks/useImageMode.test.ts`, all five cases.
 *
 * The stubs are upstream's verbatim. Their comment says jsdom has no
 * `fetch`/`createImageBitmap`/`OffscreenCanvas`; a real browser has all three,
 * which makes stubbing them *more* necessary here, not less — otherwise these
 * would issue real network requests and decode real bitmaps.
 *
 * `result.current` becomes the probe's instance export and `waitFor` becomes
 * `vi.waitFor`, which retries the same way.
 */

/** Fill the sampled canvas with a flat RGB so perceptualLightness is deterministic. */
function stubSamplingPipeline(rgb: [number, number, number]) {
	// fetch resolves to a blob (same-origin / CORS-enabled image)
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => ({ blob: async () => ({}) as Blob }))
	);
	vi.stubGlobal(
		'createImageBitmap',
		vi.fn(async () => ({ width: 100, height: 100 }) as ImageBitmap)
	);
	const [r, g, b] = rgb;
	class FakeOffscreenCanvas {
		constructor(
			public width: number,
			public height: number
		) {}
		getContext() {
			return {
				drawImage: vi.fn(),
				getImageData: (_x: number, _y: number, w: number, h: number) => {
					const data = new Uint8ClampedArray(w * h * 4);
					for (let i = 0; i < data.length; i += 4) {
						data[i] = r;
						data[i + 1] = g;
						data[i + 2] = b;
						data[i + 3] = 255;
					}
					return { data };
				}
			};
		}
	}
	vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
}

/** Simulate a cross-origin image with no CORS headers: fetch rejects. */
function stubCorsBlockedFetch() {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => {
			throw new TypeError('Failed to fetch: No Access-Control-Allow-Origin header');
		})
	);
	vi.stubGlobal('createImageBitmap', vi.fn());
	vi.stubGlobal('OffscreenCanvas', class {});
}

describe('useImageMode', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns the fallback while no src is provided', async () => {
		const { component } = await render(Probe, {
			props: { src: null, options: { fallback: 'dark' } }
		});
		expect(component.imageMode.mode).toBe('dark');
	});

	it('samples a dark image and reports "dark"', async () => {
		stubSamplingPipeline([10, 10, 10]);
		const { component } = await render(Probe, {
			props: { src: 'data:image/png;base64,AAAA' }
		});
		await vi.waitFor(() => expect(component.imageMode.mode).toBe('dark'));
	});

	it('samples a light image and reports "light"', async () => {
		stubSamplingPipeline([240, 240, 240]);
		const { component } = await render(Probe, {
			props: { src: 'data:image/png;base64,AAAA' }
		});
		await vi.waitFor(() => expect(component.imageMode.mode).toBe('light'));
	});

	// ── Reproduction for BB-001 (cluster C6) ────────────────────────────────
	// A cross-origin image with no `Access-Control-Allow-Origin` header cannot be
	// fetched with `mode: 'cors'`, so the APCA sampling pipeline never runs and the
	// hook silently stays on its fallback. This is why image-backed Thumbnail
	// overlay/remove-button contrast is unreliable for hosted demo examples that
	// point `src` at a non-CORS CDN URL.
	it('stays on fallback when a cross-origin image cannot be sampled (CORS)', async () => {
		stubCorsBlockedFetch();
		const { component } = await render(Probe, {
			props: {
				src: 'https://lookaside.facebook.com/assets/astryx/moody-scene-vertical-2.png',
				options: { fallback: null }
			}
		});
		// Give the rejected fetch + state update a chance to flush.
		await new Promise((r) => setTimeout(r, 0));
		expect(component.imageMode.mode).toBeNull();
	});

	it('requests the image with CORS mode (the constraint that fails for non-CORS hosts)', async () => {
		const fetchSpy = vi.fn(async () => {
			throw new TypeError('CORS');
		});
		vi.stubGlobal('fetch', fetchSpy);
		vi.stubGlobal('createImageBitmap', vi.fn());
		vi.stubGlobal('OffscreenCanvas', class {});
		await render(Probe, { props: { src: 'https://cross-origin.example/x.png' } });
		await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalled());
		expect(fetchSpy).toHaveBeenCalledWith('https://cross-origin.example/x.png', { mode: 'cors' });
	});
});
