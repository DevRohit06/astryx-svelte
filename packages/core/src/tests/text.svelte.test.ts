/** PORTS: Text/Text.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Text from '$lib/components/text/text.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Text/Text.test.tsx` — **3 of upstream's 31 at the 0.5.0 pin**.
 *
 * `Text` had **no ported suite at all**, a pre-existing gap recorded in
 * port/todo.md. What lands is exactly upstream's 3-case `Text custom colors`
 * describe, added at 0.3.0 for the `TextColorMap` seam, which is what the batch
 * that created this file needed.
 *
 * **The other 28 are unported**, and are deliberately left counted here rather
 * than closed quietly. Named so the gap cannot be mistaken for accounted-for
 * work: `describe('rendering')` (7 — the default `body` type, children, a ref
 * kept attached across rerenders, and the four `as` mappings), `describe('types')`
 * (5 — body/large/supporting/code/label), `describe('props')` (12 — prop
 * forwarding, `color`, `weight`, explicit `size` overrides, `display`,
 * `hasStrikethrough`, `hasTabularNumbers`, `hasCapsize`, `textWrap`,
 * `maxLines`, `wordBreak`, and `hasTruncateTooltip={false}`), the one top-level
 * `renders astryx-* class names for theme targeting` case, and
 * `describe('Text custom types')` (3 — the body fallback, the default primary
 * colour, and the per-type override).
 *
 * Upstream added **no** `Heading` case for the `TextColorMap` change — even
 * though `Heading` applies the same fallback through the shared
 * `resolveStyleColor`. Nothing is invented here to cover it. (`Heading.test.tsx`
 * stands at 24 at this pin; it has no ported suite either.)
 *
 * `children` is a `Snippet`, so upstream's inline text is supplied through the
 * shared `slot-probe`. Upstream writes `color={'brand' as TextColor}` because a
 * custom colour only becomes assignable once a theme augments `TextColorMap`;
 * the probe's props are already untyped, so the cast has no counterpart here.
 */

/** Renders a `Text` whose `children` slot holds `text`. */
function renderText(
	rest: Record<string, unknown>,
	text: string
): Promise<Awaited<ReturnType<typeof render>>> {
	return render(SlotProbe, { props: { component: Text, slot: 'children', text, rest } });
}

describe('Text custom colors', () => {
	it('renders a custom color as a stable class for theme CSS to target', async () => {
		// A theme adds a custom color (e.g. via TextColorMap augmentation +
		// defineTheme). The rendered element carries the color as a class
		// (astryx-text.<color>) so `.astryx-text.brand { color: ... }` from the
		// theme applies — mirroring how custom `type`s work.
		const screen = await renderText({ color: 'brand' }, 'Branded');
		const className =
			screen.getByText('Branded', { exact: true }).element().parentElement?.className ?? '';
		expect(className).toContain('astryx-text');
		expect(className).toContain('brand');
	});

	it('does not crash on a custom color (falls back to the primary StyleX baseline)', async () => {
		// colorStyles has no entry for a custom color; the component must resolve a
		// built-in baseline instead of indexing undefined. Built-in `primary` is
		// the baseline, so both share its StyleX color class.
		const builtinScreen = await renderText({ color: 'primary' }, 'Builtin');
		const builtin =
			builtinScreen.getByText('Builtin', { exact: true }).element().parentElement?.className ?? '';
		const customScreen = await renderText({ color: 'brand' }, 'Custom');
		const custom =
			customScreen.getByText('Custom', { exact: true }).element().parentElement?.className ?? '';

		// Neither throws, and the custom color reuses primary's baseline StyleX
		// class (the real color comes from theme CSS via the `brand` class).
		const primaryAtomic = builtin.split(/\s+/).filter((c) => c.startsWith('x'));
		expect(primaryAtomic.length).toBeGreaterThan(0);
		for (const cls of primaryAtomic) {
			expect(custom).toContain(cls);
		}
	});

	it('still applies built-in colors directly', async () => {
		const screen = await renderText({ color: 'accent' }, 'Accent');
		expect(
			screen.getByText('Accent', { exact: true }).element().parentElement?.className
		).toContain('accent');
	});
});
