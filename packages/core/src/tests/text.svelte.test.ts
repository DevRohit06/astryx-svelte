import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Text from '$lib/components/text/text.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Text/Text.test.tsx` — **3 of upstream's 30**, and the file is new
 * with this batch.
 *
 * `Text` had **no ported suite at all**, a pre-existing gap recorded in port/todo.md;
 * the 27 cases upstream carried at 0.2.0 (rendering, `as`, the type scale,
 * truncation, `weight`/`size`/`justify`, tabular numbers, custom types) are
 * still unported and are deliberately left counted here rather than closed
 * quietly. What lands is exactly the 3 cases 0.3.0 added for the `TextColorMap`
 * seam, which is what this batch's change needs.
 *
 * Upstream added **no** `Heading` case for the same change — `Heading.test.tsx`
 * is unchanged at 23 — even though `Heading` applies the same fallback through
 * the shared `resolveStyleColor`. Nothing is invented here to cover it.
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
		const className = screen.getByText('Branded').element().parentElement?.className ?? '';
		expect(className).toContain('astryx-text');
		expect(className).toContain('brand');
	});

	it('does not crash on a custom color (falls back to the primary StyleX baseline)', async () => {
		// colorStyles has no entry for a custom color; the component must resolve a
		// built-in baseline instead of indexing undefined. Built-in `primary` is
		// the baseline, so both share its StyleX color class.
		const builtinScreen = await renderText({ color: 'primary' }, 'Builtin');
		const builtin = builtinScreen.getByText('Builtin').element().parentElement?.className ?? '';
		const customScreen = await renderText({ color: 'brand' }, 'Custom');
		const custom = customScreen.getByText('Custom').element().parentElement?.className ?? '';

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
		expect(screen.getByText('Accent').element().parentElement?.className).toContain('accent');
	});
});
