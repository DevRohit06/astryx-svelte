import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	getPositionTryFallbacks,
	type LayerAlignment,
	type LayerPlacement
} from '$lib/components/layer/use-layer.svelte.js';
import ContextHarness from './fixtures/layer-context-harness.svelte';
import FixedHarness from './fixtures/layer-fixed-harness.svelte';
import HostingHarness from './fixtures/layer-hosting-harness.svelte';
import RelocatingHarness from './fixtures/layer-relocating-harness.svelte';

/**
 * Ported from Astryx's `Layer/useLayer.test.tsx` at **v0.4.5** — **all 32 of its
 * `it` blocks / 43 cases** (two `it.each` tables expand to 11 rows between
 * them), plus one beyond-upstream case documented at its own site. **33 `it` in
 * the file, 44 cases.**
 *
 * The header has now stated a wrong count three times: "all twenty-nine cases"
 * (0.4.1 minus `describe('offset')`, naming none of the five it was short), a
 * corrected twenty-seven while those five were still missing, then "all
 * thirty-two" — which counted our own file's blocks, one of which is the
 * beyond-upstream case, so it silently covered for a MISSING upstream case:
 * `declares body type instead of inheriting the host context`. That case is
 * ported now, restated for a real browser (see the comment at it), and upstream
 * has not moved this file since v0.4.2.
 *
 * `offset` had been implemented since before 0.4.0 with nothing asserting it, as
 * had the nine-case `describe('context hosting')` block 0.4.2 added.
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
		it('declares body type instead of inheriting the host context', async () => {
			const screen = await render(FixedHarness);
			// Upstream nests the harness in `<div style={{fontSize:'30px',
			// lineHeight:'3'}}>` and asserts `toHaveStyle`, which under jsdom is a
			// comparison of DECLARED text — it would report `var(--text-body-size)`
			// back unresolved and pass whether or not the cascade reached the layer.
			// Chromium resolves for real, so the host context is applied to the
			// render container (the layer renders inline in the tree here, so it is
			// a descendant) and the assertion is that the layer did NOT inherit it.
			// That is the behaviour the case is named for, and it is stricter:
			// jsdom could not have caught a declaration the engine rejected.
			screen.container.style.fontSize = '30px';
			screen.container.style.lineHeight = '3';

			const layerEl = popoverIn(screen.container);
			const probe = document.createElement('span');
			screen.container.appendChild(probe);
			expect(getComputedStyle(probe).fontSize).toBe('30px');

			expect(getComputedStyle(layerEl).fontSize).not.toBe('30px');
			expect(getComputedStyle(layerEl).lineHeight).not.toBe('90px');
			probe.remove();
		});

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

	/**
	 * Upstream's `describe('offset')`, all five cases. They had never been ported,
	 * while `offset` itself has been implemented since before 0.4.0 — the header
	 * said "all twenty-nine cases" and these were the five it was short.
	 *
	 * **Counterpart, and stronger.** Upstream reads StyleX's *debug-mode* variable
	 * names (`--x-marginBlockStart`) off the inline style, because jsdom resolves
	 * neither the `var()` indirection nor logical margin properties — so the
	 * declaration is all it can check. Chromium resolves both, so these read the
	 * computed logical margins instead: that is the fact the declaration stands in
	 * for, and it also catches a value the engine rejected, which upstream's form
	 * cannot.
	 */
	describe('offset', () => {
		async function openAndGetOffsets(props: Record<string, unknown>) {
			const layer = await openContext(props);
			const computed = getComputedStyle(layer);
			return {
				blockStart: computed.marginBlockStart,
				blockEnd: computed.marginBlockEnd,
				inlineStart: computed.marginInlineStart,
				inlineEnd: computed.marginInlineEnd
			};
		}

		const NONE = { blockStart: '0px', blockEnd: '0px', inlineStart: '0px', inlineEnd: '0px' };

		it('is flush by default', async () => {
			expect(await openAndGetOffsets({ placement: 'below' })).toEqual(NONE);
		});

		// Both edges of the axis, so the gap survives a position-try-fallbacks flip
		// to the opposite side (#4803).
		it('clears both block edges for a block placement', async () => {
			expect(await openAndGetOffsets({ placement: 'above', offset: 8 })).toEqual({
				...NONE,
				blockStart: '8px',
				blockEnd: '8px'
			});
		});

		it('clears both inline edges for an inline placement', async () => {
			expect(await openAndGetOffsets({ placement: 'end', offset: 8 })).toEqual({
				...NONE,
				inlineStart: '8px',
				inlineEnd: '8px'
			});
		});

		it('takes a CSS length string', async () => {
			// Resolved rather than literal: upstream asserts the declaration text
			// `var(--spacing-1)` survives, which is all jsdom can see. Here the
			// engine resolves it, so the assertion is that it resolves to the same
			// length `--spacing-1` holds on the page — and that it is not zero, or
			// the case would pass against an offset that never applied.
			const spacing1 = getComputedStyle(document.documentElement)
				.getPropertyValue('--spacing-1')
				.trim();
			expect(spacing1).not.toBe('');

			const offsets = await openAndGetOffsets({
				placement: 'below',
				offset: 'var(--spacing-1)'
			});
			expect(offsets.blockStart).toBe(offsets.blockEnd);
			expect(offsets.blockStart).not.toBe('0px');
			expect(offsets.inlineStart).toBe('0px');
			expect(offsets.inlineEnd).toBe('0px');
		});

		it('is ignored under custom positioning, which owns its own insets', async () => {
			expect(
				await openAndGetOffsets({ placement: 'below', offset: 8, positioning: 'custom' })
			).toEqual(NONE);
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

/**
 * Upstream's `describe('context hosting')`, added at 0.4.2 with #5039. Nine
 * cases; all nine are here.
 *
 * Four of them are **counterparts rather than transcriptions**, and each says so
 * at its own site. Upstream mocks `window.getComputedStyle` wholesale because
 * jsdom computes no styles at all, so its assertions are about what the port
 * *wrote down*. These run in a real Chromium, which computes all of it, so the
 * same claims are checked against live computed values — strictly stronger, and
 * in the custom-property cases it is the only form that can distinguish "the
 * layer inherits from the corrective host" from "the layer got a snapshot of
 * the host's values", which is the entire point of #5039's
 * `readPortalWritingContext`.
 *
 * `rerender` has no counterpart either: these use a reactive prop on the fixture
 * and let the `$state` write flush, which is the substitute the other suites
 * already use.
 */
describe('useLayer context hosting', () => {
	const nativeShowPopover = HTMLElement.prototype.showPopover;

	afterEach(() => {
		HTMLElement.prototype.showPopover = nativeShowPopover;
	});

	it('keeps closed content mounted by default for existing consumers', async () => {
		const screen = await render(ContextHarness);

		expect(screen.container.querySelector('template')).not.toBeNull();
		expect(screen.container.querySelector('[popover]')).not.toBeNull();
		expect(screen.container.textContent).toContain('content');
	});

	it('renders only an inert marker until show is requested', async () => {
		const screen = await render(HostingHarness);

		const sentinel = screen.container.querySelector('template');
		expect(sentinel).not.toBeNull();
		expect(sentinel?.hasAttribute('id')).toBe(false);
		expect(screen.container.querySelector('[popover]')).toBeNull();
		expect(screen.container.textContent).not.toContain('Layer action');
	});

	it('keeps the final layer inline when the JSX position is safe', async () => {
		const screen = await render(HostingHarness);
		await screen.getByRole('button', { name: 'Trigger' }).click();

		const layer = await vi.waitFor(() => popoverIn(screen.container));
		const following = screen.getByRole('button', { name: 'Following control' }).element();
		expect(layer.parentElement).toBe(screen.container.firstElementChild);
		expect(layer.nextElementSibling).toBe(following);
		expect(screen.container.querySelector('template')).not.toBeNull();
	});

	it('portals out of an unsafe parent and preserves its logical writing context', async () => {
		const showSpy = vi.fn(HTMLElement.prototype.showPopover);
		HTMLElement.prototype.showPopover = showSpy;

		const screen = await render(HostingHarness, {
			props: { unsafe: true, direction: 'rtl', writingMode: 'vertical-rl' }
		});
		const trigger = screen.getByRole('button', { name: 'Trigger' }).element();
		await screen.getByRole('button', { name: 'Trigger' }).click();

		const layer = await vi.waitFor(() => popoverIn(screen.container));
		const host = screen.container.querySelector('[data-testid="host"]');
		expect(layer.parentElement).toBe(host);
		expect(screen.container.querySelector('p')?.contains(layer)).toBe(false);
		// Counterpart: upstream mocks `getComputedStyle` to answer rtl/vertical-rl
		// and then asserts `toHaveStyle`. Here the host really carries them, so the
		// carried context is read off the layer's own computed style.
		expect(getComputedStyle(layer).direction).toBe('rtl');
		expect(getComputedStyle(layer).writingMode).toBe('vertical-rl');
		expect(showSpy).toHaveBeenCalledWith({ source: trigger });
	});

	it('inherits custom properties from the corrective host without freezing an inline snapshot', async () => {
		const screen = await render(HostingHarness, {
			props: { unsafe: true, themeColor: 'rgb(1, 2, 3)' }
		});
		await screen.getByRole('button', { name: 'Trigger' }).click();

		const layer = await vi.waitFor(() => popoverIn(screen.container));
		const host = screen.container.querySelector('[data-testid="host"]') as HTMLElement;
		expect(layer.parentElement).toBe(host);
		// Nothing is snapshotted onto the layer…
		expect(layer.style.getPropertyValue('--test-layer-color')).toBe('');
		expect(host.style.getPropertyValue('--test-layer-color')).toBe('rgb(1, 2, 3)');
		// …so the value reaches it by inheritance, live. Upstream cannot check this
		// half at all — jsdom resolves no custom properties — and it is the half
		// that fails if the port ever starts copying them onto the element.
		expect(getComputedStyle(layer).getPropertyValue('--test-layer-color').trim()).toBe(
			'rgb(1, 2, 3)'
		);

		await screen.rerender({ unsafe: true, themeColor: 'rgb(4, 5, 6)' });

		await vi.waitFor(() => {
			expect(
				getComputedStyle(popoverIn(screen.container)).getPropertyValue('--test-layer-color').trim()
			).toBe('rgb(4, 5, 6)');
		});
		expect(popoverIn(screen.container).style.getPropertyValue('--test-layer-color')).toBe('');
	});

	it('keeps a shared writing context inheriting live from the corrective host', async () => {
		const screen = await render(HostingHarness, {
			props: { unsafe: true, direction: 'rtl', writingMode: 'vertical-rl' }
		});
		await screen.getByRole('button', { name: 'Trigger' }).click();

		await vi.waitFor(() => {
			expect(getComputedStyle(popoverIn(screen.container)).direction).toBe('rtl');
		});

		await screen.rerender({ unsafe: true, direction: 'ltr', writingMode: 'horizontal-tb' });

		await vi.waitFor(() => {
			expect(getComputedStyle(popoverIn(screen.container)).direction).toBe('ltr');
		});
		expect(getComputedStyle(popoverIn(screen.container)).writingMode).toBe('horizontal-tb');
	});

	it('re-resolves the host when a persistent render call moves', async () => {
		const screen = await render(RelocatingHarness, { props: { unsafe: true } });

		const host = screen.container.querySelector('[data-testid="unsafe-host"]');
		expect(popoverIn(screen.container).parentElement).toBe(host);
		expect(screen.container.querySelector('p')?.contains(popoverIn(screen.container))).toBe(false);

		await screen.rerender({ unsafe: false });

		await vi.waitFor(() => {
			const section = screen.container.querySelector('section');
			expect(popoverIn(screen.container).parentElement).toBe(section);
			expect(section?.querySelector('template')).not.toBeNull();
		});
	});

	it('reopens an open lazy layer after its render call moves', async () => {
		const onShow = vi.fn();
		const native = nativeShowPopover;
		const showSpy = vi.fn(function (this: HTMLElement, options?: unknown) {
			if (!this.isConnected) {
				throw new Error('showPopover called on a detached layer');
			}
			this.dataset.open = 'true';
			return (native as (this: HTMLElement, o?: unknown) => void).call(this, options);
		});
		HTMLElement.prototype.showPopover = showSpy as typeof HTMLElement.prototype.showPopover;

		const screen = await render(RelocatingHarness, {
			props: { unsafe: true, lazyMount: true, onShow }
		});
		await screen.getByRole('button', { name: 'Trigger' }).click();

		await vi.waitFor(() => {
			expect(popoverIn(screen.container).getAttribute('data-open')).toBe('true');
		});

		await screen.rerender({ unsafe: false, lazyMount: true, onShow });

		await vi.waitFor(() => {
			const layer = popoverIn(screen.container);
			expect(layer.parentElement).toBe(screen.container.querySelector('[data-testid="safe-host"]'));
			expect(layer.getAttribute('data-open')).toBe('true');
		});
		expect(onShow).toHaveBeenCalledTimes(1);
	});

	/**
	 * Beyond upstream, and the reason it earns its place is the bug it was
	 * written for: `attachSentinel` read the `isOpen` `$state` directly, so
	 * opening a lazy layer re-ran the attachment, re-resolved `contextMount` to a
	 * new-but-equal object, and `{@attach intoPortal(...)}` — keyed on that
	 * object's identity — tore itself down and re-appended the node. Removing a
	 * *showing* popover evicts it from the top layer without firing `toggle`, and
	 * nothing re-shows it, so every corrected-out `HoverCard` rendered hidden.
	 *
	 * Upstream cannot express this case: React re-renders an equal `contextMount`
	 * into the same `createPortal` container and moves no DOM, and jsdom has no
	 * top layer to be evicted from. The whole hazard is Svelte-specific, which is
	 * the bar `CLAUDE.md` sets for coverage beyond upstream.
	 *
	 * Mutation-checked: reverting either half of the fix (the `untrack` in
	 * `attachSentinel`, or `requestContextMount`'s equality bail-out) fails this.
	 */
	it('leaves a corrected-out layer actually showing, not merely mounted', async () => {
		const screen = await render(HostingHarness, { props: { unsafe: true } });
		await screen.getByRole('button', { name: 'Trigger' }).click();

		const layer = await vi.waitFor(() => popoverIn(screen.container));
		await vi.waitFor(() => {
			expect(layer.matches(':popover-open')).toBe(true);
		});
		expect(getComputedStyle(layer).display).not.toBe('none');
	});
});
