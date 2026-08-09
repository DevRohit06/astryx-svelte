import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	getPositionTryFallbacks,
	type LayerAlignment,
	type LayerPlacement
} from '$lib/components/layer/use-layer.svelte.js';
import ContextHarness from './fixtures/layer-context-harness.svelte';
import FixedHarness from './fixtures/layer-fixed-harness.svelte';

/**
 * Ported from Astryx's `Layer/useLayer.test.tsx`, all twenty-nine cases.
 *
 * `getPositionTryFallbacks` is pure and its five cases transcribe. The rendered
 * ones needed two mechanical changes:
 *
 * **Assertions read the `style` attribute, not the CSSOM.** Upstream reads
 * `layerEl.style.positionTryFallbacks`; that is a jsdom convenience — jsdom has
 * no CSS parser, so an unknown property survives as a JS property. These run in
 * a real browser, where the CSSOM only holds declarations the engine actually
 * parsed, so a `position-try-fallbacks` the running Chromium did not implement
 * would read back empty and the test would pass vacuously. `getAttribute`
 * returns the attribute text verbatim regardless, which is the thing the port
 * is responsible for emitting. `style.display`, `style.left` and `style.top`
 * stay on the CSSOM: those are universally supported, and `display` is set
 * imperatively by the fallback path rather than rendered.
 *
 * **`position-area` is compared as a token set, not a string.** Svelte writes
 * the style attribute through the CSSOM, so what comes back is the browser's
 * *canonical* serialisation — and Chromium reorders `position-area` to
 * block-axis-first, turning our emitted `self-inline-end span-self-block-end`
 * into `span-self-block-end self-inline-end`. The two name the same pair of
 * axis values (the keywords are order-insensitive), so the cases compare sorted
 * tokens of the parsed property. `position-try-fallbacks` gets the same
 * treatment per entry — its list order is meaningful, the keywords inside an
 * entry are not. Both are stricter than upstream's string match rather than
 * looser: they only pass if the engine actually accepted the value, where jsdom
 * would have echoed back nonsense unchanged.
 *
 * Everything else round-trips identically, including the `a: b; c: d` spacing —
 * React sets its style object through the CSSOM too, so upstream's assertions
 * carry over verbatim.
 *
 * `onReady` becomes an instance `export const` on the fixed harness, which is
 * the pattern the hook suites already use for a hook that returns callables.
 */

const FLIPS = 'flip-block, flip-inline, flip-block flip-inline';

function styleOf(el: Element | null): string {
	return el?.getAttribute('style') ?? '';
}

function popoverIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[popover]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a popover element');
	}
	return el;
}

/** `position-area` keywords are order-insensitive; the engine canonicalises. */
function areaTokens(value: string): string[] {
	return value.trim().split(/\s+/).filter(Boolean).sort();
}

/**
 * A `position-try-fallbacks` list, normalised the same way: the list order is
 * meaningful (it is the order the browser tries them in) but each entry is a
 * position-area or tactic pair, which is not.
 */
function fallbackEntries(value: string): string[] {
	return value
		.split(',')
		.map((entry) => areaTokens(entry).join(' '))
		.filter(Boolean);
}

function fallbacksOf(el: HTMLElement): string[] {
	return fallbackEntries(el.style.getPropertyValue('position-try-fallbacks'));
}

async function openContext(props: Record<string, unknown> = {}): Promise<HTMLElement> {
	const screen = await render(ContextHarness, { props });
	await screen.getByRole('button', { name: 'trigger' }).click();
	return popoverIn(screen.container);
}

async function openAndGetStyle(props: Record<string, unknown> = {}): Promise<string> {
	return styleOf(await openContext(props));
}

describe('getPositionTryFallbacks (issue #3671)', () => {
	it('appends inline span fallbacks for centered above/below layers so inline overflow can resolve (flip-inline is a no-op on center)', () => {
		expect(getPositionTryFallbacks('above', 'center')).toBe(
			`${FLIPS}, top span-left, top span-right, bottom span-left, bottom span-right`
		);
		expect(getPositionTryFallbacks('below', 'center')).toBe(
			`${FLIPS}, bottom span-left, bottom span-right, top span-left, top span-right`
		);
	});

	it('appends block span fallbacks for centered start/end layers so block overflow can resolve (flip-block is a no-op on center)', () => {
		expect(getPositionTryFallbacks('start', 'center')).toBe(
			`${FLIPS}, left span-top, left span-bottom, right span-top, right span-bottom`
		);
		expect(getPositionTryFallbacks('end', 'center')).toBe(
			`${FLIPS}, right span-top, right span-bottom, left span-top, left span-bottom`
		);
	});

	it('keeps flip-only fallbacks for non-centered alignments (flips already resolve overflow there)', () => {
		const nonCentered: [LayerPlacement, LayerAlignment][] = [
			['above', 'start'],
			['above', 'end'],
			['below', 'start'],
			['below', 'end'],
			['start', 'start'],
			['start', 'end'],
			['end', 'start'],
			['end', 'end']
		];
		for (const [placement, alignment] of nonCentered) {
			expect(getPositionTryFallbacks(placement, alignment)).toBe(FLIPS);
		}
	});

	it('defaults to above/center when called without arguments (matches the Layer defaults)', () => {
		expect(getPositionTryFallbacks()).toBe(getPositionTryFallbacks('above', 'center'));
		expect(getPositionTryFallbacks(undefined, undefined)).toBe(
			`${FLIPS}, top span-left, top span-right, bottom span-left, bottom span-right`
		);
	});

	it('produces well-formed, duplicate-free lists with flips first and axis-correct spans for every placement/alignment combo', () => {
		const placements: LayerPlacement[] = ['above', 'below', 'start', 'end'];
		const alignments: LayerAlignment[] = ['start', 'center', 'end'];
		const spanPattern: Record<LayerPlacement, RegExp> = {
			above: /^(top|bottom) span-(left|right)$/,
			below: /^(top|bottom) span-(left|right)$/,
			start: /^(left|right) span-(top|bottom)$/,
			end: /^(left|right) span-(top|bottom)$/
		};

		for (const placement of placements) {
			for (const alignment of alignments) {
				const list = getPositionTryFallbacks(placement, alignment);
				const items = list.split(', ');

				expect(items.slice(0, 3)).toEqual(['flip-block', 'flip-inline', 'flip-block flip-inline']);
				expect(new Set(items).size).toBe(items.length);
				for (const item of items.slice(3)) {
					expect(item).toMatch(spanPattern[placement]);
				}
				expect(items.length).toBe(alignment === 'center' ? 7 : 3);
			}
		}
	});

	it('updates the fallback list when placement/alignment props change on re-render', async () => {
		const screen = await render(ContextHarness, {
			props: { placement: 'above', alignment: 'center' }
		});
		const layerEl = popoverIn(screen.container);
		expect(fallbacksOf(layerEl)).toContain(areaTokens('top span-left').join(' '));

		await screen.rerender({ placement: 'above', alignment: 'start' });
		expect(fallbacksOf(layerEl)).toEqual(fallbackEntries(FLIPS));

		await screen.rerender({ placement: 'start', alignment: 'center' });
		expect(fallbacksOf(layerEl)).toEqual(
			fallbackEntries(
				`${FLIPS}, left span-top, left span-bottom, right span-top, right span-bottom`
			)
		);
	});

	it('does not apply anchor fallbacks in fixed mode (manual coordinates)', async () => {
		const screen = await render(FixedHarness, { props: { x: 10, y: 20 } });
		const layerEl = popoverIn(screen.container);
		expect(styleOf(layerEl)).not.toContain('position-try-fallbacks');
		expect(layerEl.style.left).toBe('10px');
		expect(layerEl.style.top).toBe('20px');
	});

	it('applies span fallbacks to the rendered popover for the default (above/center) layer', async () => {
		const screen = await render(ContextHarness);
		const layerEl = popoverIn(screen.container);
		expect(fallbacksOf(layerEl)).toEqual(
			fallbackEntries(
				`${FLIPS}, top span-left, top span-right, bottom span-left, bottom span-right`
			)
		);
	});
});

describe('useLayer', () => {
	const originalShowPopover = HTMLElement.prototype.showPopover;
	const originalHidePopover = HTMLElement.prototype.hidePopover;

	afterEach(() => {
		// Restore whatever the environment originally provided.
		if (originalShowPopover === undefined) {
			// @ts-expect-error - deleting to simulate original absence
			delete HTMLElement.prototype.showPopover;
		} else {
			HTMLElement.prototype.showPopover = originalShowPopover;
		}
		if (originalHidePopover === undefined) {
			// @ts-expect-error - deleting to simulate original absence
			delete HTMLElement.prototype.hidePopover;
		} else {
			HTMLElement.prototype.hidePopover = originalHidePopover;
		}
	});

	describe('when the Popover API is supported', () => {
		it('calls showPopover/hidePopover on show/hide', async () => {
			const showSpy = vi.fn();
			const hideSpy = vi.fn();
			HTMLElement.prototype.showPopover = showSpy;
			HTMLElement.prototype.hidePopover = hideSpy;

			const screen = await render(FixedHarness);

			screen.component.layer.show();
			expect(showSpy).toHaveBeenCalledTimes(1);

			screen.component.layer.hide();
			expect(hideSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('when the Popover API is unsupported (Safari <17 / Firefox <125)', () => {
		it('show() does not throw when showPopover is undefined and the layer becomes visible', async () => {
			// Simulate a browser without the Popover API (finding infra-4).
			// @ts-expect-error - simulate missing API
			delete HTMLElement.prototype.showPopover;
			// @ts-expect-error - simulate missing API
			delete HTMLElement.prototype.hidePopover;

			const screen = await render(FixedHarness);
			const layerEl = popoverIn(screen.container);

			expect(() => screen.component.layer.show()).not.toThrow();
			// Falls back to plain visibility so the layer is still usable. The
			// declaration is *rendered* (the hook's `fallbackStyle`, merged by
			// `<Layer>`) rather than assigned to `element.style`, so it lands on the
			// next flush — see `LayerRenderable.fallbackStyle` for why an out-of-band
			// write was unsafe once a consumer started passing a changing `style`.
			await vi.waitFor(() => {
				expect(layerEl.style.display).toBe('block');
			});
		});

		it('hide() does not throw when hidePopover is undefined and the layer is hidden', async () => {
			// @ts-expect-error - simulate missing API
			delete HTMLElement.prototype.showPopover;
			// @ts-expect-error - simulate missing API
			delete HTMLElement.prototype.hidePopover;

			const screen = await render(FixedHarness);
			const layerEl = popoverIn(screen.container);

			screen.component.layer.show();
			expect(() => screen.component.layer.hide()).not.toThrow();
			// Rendered, not assigned — see the sibling case above.
			await vi.waitFor(() => {
				expect(layerEl.style.display).toBe('none');
			});
		});
	});
});

describe('useLayer context positioning', () => {
	// The mapping uses the self-* logical keyword family, so the emitted string
	// is direction-independent by construction: the browser resolves the inline
	// axis against the popover's own inherited direction, and RTL mirrors with
	// no JS. These assert the emitted string; the actual RTL geometry was
	// verified against the full 12-cell matrix in a real browser.
	describe('self-* position-area mapping', () => {
		it.each([
			// [placement, alignment, expected position-area]
			['above', 'start', 'self-block-start span-self-inline-end'],
			['above', 'center', 'self-block-start'],
			['above', 'end', 'self-block-start span-self-inline-start'],
			['below', 'start', 'self-block-end span-self-inline-end'],
			['below', 'center', 'self-block-end'],
			['below', 'end', 'self-block-end span-self-inline-start'],
			['start', 'start', 'self-inline-start span-self-block-end'],
			['start', 'center', 'self-inline-start'],
			['start', 'end', 'self-inline-start span-self-block-start'],
			['end', 'start', 'self-inline-end span-self-block-end'],
			['end', 'center', 'self-inline-end'],
			['end', 'end', 'self-inline-end span-self-block-start']
		] as const)(
			'placement=%s alignment=%s emits position-area %s',
			async (placement, alignment, expectedArea) => {
				const layerEl = await openContext({ placement, alignment });
				expect(areaTokens(layerEl.style.getPropertyValue('position-area'))).toEqual(
					areaTokens(expectedArea)
				);
				expect(styleOf(layerEl)).not.toContain('justify-self');
			}
		);

		it('emits the same string regardless of trigger direction', async () => {
			const first = await render(ContextHarness, {
				props: { placement: 'below', alignment: 'start' }
			});
			await first.getByRole('button', { name: 'trigger' }).click();
			const ltr = popoverIn(first.container).style.getPropertyValue('position-area');
			await first.unmount();

			const second = await render(ContextHarness, {
				props: {
					placement: 'below',
					alignment: 'start',
					triggerDir: 'rtl',
					triggerStyle: 'direction:rtl'
				}
			});
			await second.getByRole('button', { name: 'trigger' }).click();
			const rtl = popoverIn(second.container).style.getPropertyValue('position-area');

			// The unique position-anchor id differs per render; the placement
			// mapping must not.
			expect(rtl).toBeTruthy();
			expect(rtl).toBe(ltr);
		});

		it('keeps position-try fallbacks intact', async () => {
			const layerEl = await openContext({ placement: 'below', alignment: 'start' });
			expect(fallbacksOf(layerEl)).toEqual(fallbackEntries(FLIPS));
		});
	});

	describe("positioning='custom' (consumer-authored position styles)", () => {
		// Consumers like Carousel and Tokenizer keep the popover behavior and
		// anchor wiring but position the layer themselves. The opt-out must
		// suppress every placement-derived style — position-area and the try
		// fallbacks — so those consumers never need to know which properties
		// would otherwise have been emitted.
		it('keeps the anchor wiring but derives no placement styles', async () => {
			const style = await openAndGetStyle({
				positioning: 'custom',
				layerStyle: 'position-area:center'
			});
			expect(style).toContain('position-anchor');
			// The consumer-authored area is the only one present…
			expect(style).toContain('position-area: center');
			// …and no placement-derived styles leak through.
			expect(style).not.toContain('position-try-fallbacks');
		});

		it('ignores placement and alignment when positioning is custom', async () => {
			// placement/alignment are documented as ignored under custom. Derived
			// output would be position-area "self-block-end span-self-inline-end";
			// none of it may appear.
			const style = await openAndGetStyle({
				positioning: 'custom',
				placement: 'below',
				alignment: 'start',
				layerStyle: 'position-area:center'
			});
			expect(style).toContain('position-anchor');
			expect(style).toContain('position-area: center');
			expect(style).not.toContain('self-block');
			expect(style).not.toContain('position-try-fallbacks');
		});

		it('emits only the anchor wiring when custom positioning passes no style at all', async () => {
			// The strongest suppression probe: with no consumer style in the merge
			// (Tokenizer's insets-only shape reduces to this), nothing can clobber a
			// leaked derived value — any position-area or try-fallbacks in the
			// output is a genuine leak.
			const style = await openAndGetStyle({ positioning: 'custom' });
			expect(style).toContain('position-anchor');
			expect(style).not.toContain('position-area');
			expect(style).not.toContain('position-try-fallbacks');
		});
	});

	it('fixed mode emits no anchor-positioning styles', async () => {
		const screen = await render(FixedHarness, { props: { x: 10, y: 20 } });
		await screen.getByRole('button', { name: 'opener' }).click();

		const style = styleOf(screen.container.querySelector('[popover]'));
		expect(style).not.toContain('position-area');
		expect(style).not.toContain('position-anchor');
	});
});
