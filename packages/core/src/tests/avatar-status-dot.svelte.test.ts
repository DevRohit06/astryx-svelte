import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AvatarSize } from '$lib/components/avatar/avatar.stylex.js';
import type { AvatarStatusDotVariant } from '$lib/components/avatar/avatar-status-dot.stylex.js';
import AvatarStatusFixture from './fixtures/avatar-status-fixture.svelte';
import { atomicClasses, probe } from './fixtures/avatar-status-dot-probe.stylex.js';

/**
 * Astryx's `Avatar/AvatarStatusDot.test.tsx`, ported case for case — **19
 * upstream cases at the 0.5.0 pin, 19 here, none dropped**. The file has no `displayName` case,
 * no snapshot, no `ref` case and no no-JSX construction form, so nothing is
 * legitimately absent.
 *
 * Three translations, each commented where it appears:
 *
 * 1. **`renderDot` goes through a fixture.** Upstream writes
 *    `status={<AvatarStatusDot {...dotProps} />}` inline; `status` is a
 *    `Snippet` here and a snippet can only be authored in a template, so
 *    `avatar-status-fixture.svelte` is the smallest thing that can hand one to
 *    `Avatar`. The dot's `icon` is a snippet for the same reason, which is why
 *    the fixture takes it as a discriminator rather than as a node.
 *
 * 2. **The two StyleX probes live in a `.stylex.ts` fixture.** StyleX may only
 *    be imported from a `.ts`/`.stylex.ts` module — the bundler plugin
 *    Babel-parses anything importing `@stylexjs/stylex` and would read a Svelte
 *    template as JSX. The `stylex.create` calls and the `__`-debug-class filter
 *    are upstream's, moved one file over.
 *
 * 3. **The non-renderable-icon case is a counterpart** (`keeps the glyph for
 *    non-renderable icons`), for the reason stated at that case.
 *
 * Runs in the **client** project: the glyph geometry is read off real SVG
 * attributes, and the two probe cases compare against classes the real StyleX
 * compiler emitted for this page.
 */

const GLYPH_SELECTOR = '.astryx-avatar-status-dot-glyph';
const DOT_SELECTOR = '.astryx-avatar-status-dot';

/**
 * Renders an AvatarStatusDot inside an Avatar of the given numeric size and
 * returns the dot root element together with the render's container (the suite
 * scopes `user-icon` lookups to it, since a case may render more than once).
 * Size tiers: <=36 -> 10px dot (no icons), 40-72 -> 20px dot, >=96 -> 32px dot.
 */
async function renderDot(
	dotProps: { variant?: AvatarStatusDotVariant; label?: string; icon?: 'svg' | 'none' },
	avatarSize: 36 | 48 | 128 = 48
): Promise<{ dot: HTMLElement; container: HTMLElement }> {
	const { icon = 'none', ...dot } = dotProps;
	const screen = await render(AvatarStatusFixture, {
		props: {
			avatar: { name: 'Ada Lovelace', size: avatarSize as AvatarSize },
			dot,
			icon
		}
	});
	const dotEl = screen.container.querySelector(DOT_SELECTOR);
	expect(dotEl).not.toBeNull();
	return { dot: dotEl as HTMLElement, container: screen.container };
}

describe('AvatarStatusDot', () => {
	describe('shape glyphs (WCAG 1.4.1 — colour is not the only signal)', () => {
		it('renders no glyph for success: the plain filled dot is the reference shape', async () => {
			const { dot } = await renderDot({ variant: 'success' });
			expect(dot.querySelector(GLYPH_SELECTOR)).toBeNull();
		});

		it('renders a ring glyph for neutral', async () => {
			const { dot } = await renderDot({ variant: 'neutral' });
			const glyph = dot.querySelector(GLYPH_SELECTOR);
			expect(glyph).not.toBeNull();
			expect(glyph).toHaveAttribute('data-shape', 'ring');
		});

		it('renders a minus glyph for error', async () => {
			const { dot } = await renderDot({ variant: 'error' });
			const glyph = dot.querySelector(GLYPH_SELECTOR);
			expect(glyph).not.toBeNull();
			expect(glyph).toHaveAttribute('data-shape', 'minus');
		});

		it('hides the glyph from assistive tech: it is a visual redundancy of the status', async () => {
			const { dot } = await renderDot({ variant: 'error' });
			expect(dot.querySelector(GLYPH_SELECTOR)).toHaveAttribute('aria-hidden', 'true');
		});

		it('renders glyphs at every size tier', async () => {
			for (const size of [36, 48, 128] as const) {
				const { dot } = await renderDot({ variant: 'neutral' }, size);
				expect(dot.querySelector(GLYPH_SELECTOR)).not.toBeNull();
			}
		});

		it('draws the glyph as an inline svg sized to the dot inner field', async () => {
			// The glyph is a stroked <svg>, matching how the rest of the system
			// draws marks (Icon's defaultIcons, the CheckboxInput checkmark).
			// Its viewBox is 1 user unit per px of the dot's inner field
			// (dot minus both borders), so stroke widths below are literal px.
			const cases = [
				[36, 8],
				[48, 16],
				[128, 24]
			] as const;
			for (const [avatarSize, field] of cases) {
				const { dot } = await renderDot({ variant: 'neutral' }, avatarSize);
				const glyph = dot.querySelector(GLYPH_SELECTOR) as SVGElement;
				expect(glyph.tagName.toLowerCase(), `avatar ${avatarSize}`).toBe('svg');
				expect(glyph.getAttribute('viewBox'), `avatar ${avatarSize}`).toBe(`0 0 ${field} ${field}`);
				expect(glyph.getAttribute('width'), `avatar ${avatarSize}`).toBe(String(field));
				expect(glyph.getAttribute('height'), `avatar ${avatarSize}`).toBe(String(field));
			}
		});

		it('strokes the ring at the system glyph weight, not a quarter of the field', async () => {
			// stroke ~= field / 12, floored at 1px for the smallest tier, which
			// puts these on the icon family's 1 / 1.5 / 2 ladder (~6-12% of the
			// field) instead of the 25% band a CSS box cutout produced.
			const cases = [
				// avatar size, field, stroke, radius = (field - stroke) / 2
				[36, 8, 1, 3.5],
				[48, 16, 1.5, 7.25],
				[128, 24, 2, 11]
			] as const;
			for (const [avatarSize, field, stroke, radius] of cases) {
				const { dot } = await renderDot({ variant: 'neutral' }, avatarSize);
				const circle = dot.querySelector(`${GLYPH_SELECTOR} circle`) as SVGCircleElement;
				expect(circle, `avatar ${avatarSize}`).not.toBeNull();
				expect(circle.getAttribute('stroke-width'), `avatar ${avatarSize}`).toBe(String(stroke));
				// Radius is to the stroke centreline, so the ring's outer edge lands
				// exactly on the inner field and never clips against the border.
				expect(circle.getAttribute('r'), `avatar ${avatarSize}`).toBe(String(radius));
				expect(circle.getAttribute('cx'), `avatar ${avatarSize}`).toBe(String(field / 2));
				expect(circle.getAttribute('cy'), `avatar ${avatarSize}`).toBe(String(field / 2));
				expect(circle.getAttribute('fill'), `avatar ${avatarSize}`).toBe('none');
			}
		});

		it('strokes the minus bar at the same weight, spanning 75% of the field with round caps', async () => {
			// Ends are inset by half the stroke so the round caps land inside the
			// 75% span rather than overhanging it.
			const cases = [
				// avatar size, field, stroke, x1, x2
				[36, 8, 1, 1.5, 6.5],
				[48, 16, 1.5, 2.75, 13.25],
				[128, 24, 2, 4, 20]
			] as const;
			for (const [avatarSize, field, stroke, x1, x2] of cases) {
				const { dot } = await renderDot({ variant: 'error' }, avatarSize);
				const line = dot.querySelector(`${GLYPH_SELECTOR} line`) as SVGLineElement;
				expect(line, `avatar ${avatarSize}`).not.toBeNull();
				expect(line.getAttribute('stroke-width'), `avatar ${avatarSize}`).toBe(String(stroke));
				expect(line.getAttribute('x1'), `avatar ${avatarSize}`).toBe(String(x1));
				expect(line.getAttribute('x2'), `avatar ${avatarSize}`).toBe(String(x2));
				expect(line.getAttribute('y1'), `avatar ${avatarSize}`).toBe(String(field / 2));
				expect(line.getAttribute('y2'), `avatar ${avatarSize}`).toBe(String(field / 2));
				expect(line.getAttribute('stroke-linecap'), `avatar ${avatarSize}`).toBe('round');
			}
		});

		it('paints both glyphs from currentColor so the dot owns the ink colour', async () => {
			for (const variant of ['neutral', 'error'] as const) {
				const { dot } = await renderDot({ variant }, 48);
				const mark = dot.querySelector(
					`${GLYPH_SELECTOR} circle, ${GLYPH_SELECTOR} line`
				) as SVGElement;
				expect(mark.getAttribute('stroke'), variant).toBe('currentColor');
			}
		});

		it('fills the ring variant with surface and inks it with the variant colour', async () => {
			// A ring only reads as hollow if its interior is not the variant
			// colour, so `neutral` inverts: surface fill, coloured stroke.
			// StyleX atomic classes are deterministic, so a local probe pins it.
			const { dot } = await renderDot({ variant: 'neutral' }, 48);
			const classes = atomicClasses(probe.ring);
			expect(classes.length).toBeGreaterThan(0);
			for (const cls of classes) {
				expect(dot.className).toContain(cls);
			}
		});

		it('lets a user icon inherit the dot ink instead of hard-coding surface', async () => {
			// Surface ink on the surface-filled ring variant would be invisible.
			const { container } = await renderDot({ variant: 'neutral', icon: 'svg' }, 48);
			const iconWrapper = container.querySelector('[data-testid="user-icon"]')
				?.parentElement as HTMLElement;
			expect(iconWrapper).not.toBeNull();
			const surfaceInkClasses = atomicClasses(probe.surfaceInk);
			expect(surfaceInkClasses.length).toBeGreaterThan(0);
			for (const cls of surfaceInkClasses) {
				expect(iconWrapper.className).not.toContain(cls);
			}
		});

		it('renders no glyph for custom augmented variants (documented: they must bring their own non-colour mark)', async () => {
			// Upstream writes `'away' as AvatarStatusDotVariant` inline. The extra
			// hop through `unknown` is TypeScript's comparability rule, not a
			// different value: `AvatarStatusDotVariant` is a closed union of string
			// literals until a theme augments `AvatarStatusDotVariantMap`.
			const { dot } = await renderDot({ variant: 'away' as unknown as AvatarStatusDotVariant });
			expect(dot.querySelector(GLYPH_SELECTOR)).toBeNull();
		});
	});

	describe('glyph and icon interplay', () => {
		it('suppresses the glyph when a user icon renders: the icon is the non-colour mark', async () => {
			const { dot, container } = await renderDot({ variant: 'error', icon: 'svg' }, 48);
			expect(container.querySelector('[data-testid="user-icon"]')).toBeInTheDocument();
			expect(dot.querySelector(GLYPH_SELECTOR)).toBeNull();
		});

		it('keeps the glyph at the smallest tier where icons never render', async () => {
			const { dot, container } = await renderDot({ variant: 'error', icon: 'svg' }, 36);
			expect(container.querySelector('[data-testid="user-icon"]')).not.toBeInTheDocument();
			expect(dot.querySelector(GLYPH_SELECTOR)).not.toBeNull();
		});

		// COUNTERPART for upstream's `keeps the glyph for non-renderable icons:
		// booleans from `cond && <Icon />` render nothing`, which loops over
		// `icon={true | false | ''}`. Those values exist because React's `icon` is a
		// `ReactNode`; upstream guards them with `isRenderable()`. Here `icon` is a
		// `Snippet | undefined`, so the only non-renderable value the type admits is
		// `undefined` — which is exactly what `cond ? snippet : undefined` (the
		// Svelte spelling of `cond && <Icon />`) yields when the condition is false.
		// Same question: an icon prop that renders nothing must not cost the glyph.
		// The other half of upstream's contract — "a component that renders nothing
		// still counts as an icon and suppresses the glyph" — is unchanged here,
		// since a snippet is always an icon.
		it('keeps the glyph for non-renderable icons: booleans from `cond && <Icon />` render nothing', async () => {
			const { dot } = await renderDot({ variant: 'error', icon: 'none' }, 48);
			expect(dot.querySelector(GLYPH_SELECTOR), 'icon={undefined}').not.toBeNull();
		});
	});

	describe('existing contract', () => {
		it('exposes role="img" with the label as accessible name when label is provided', async () => {
			const { dot } = await renderDot({ variant: 'success', label: 'Online' });
			expect(dot).toHaveAttribute('role', 'img');
			expect(dot).toHaveAttribute('aria-label', 'Online');
		});

		it('has no img role without a label', async () => {
			const { dot } = await renderDot({ variant: 'success' });
			expect(dot).not.toHaveAttribute('role');
		});

		it('reflects the variant as a data attribute for theming', async () => {
			const { dot } = await renderDot({ variant: 'neutral' });
			expect(dot).toHaveAttribute('data-variant', 'neutral');
		});

		it('renders the user icon at tiers with room for it, hidden from assistive tech', async () => {
			const { container } = await renderDot({ variant: 'success', icon: 'svg' }, 128);
			const icon = container.querySelector('[data-testid="user-icon"]');
			expect(icon).toBeInTheDocument();
			expect(icon?.parentElement).toHaveAttribute('aria-hidden', 'true');
		});
	});
});
