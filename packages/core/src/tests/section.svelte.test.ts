import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import SectionProbe from './fixtures/section-probe.svelte';

/**
 * Upstream's `Section/Section.test.tsx`, ported case for case — all 20 `it()`s.
 *
 * `Section` renders two nested divs: the OUTER wrapper carries rest props,
 * `class`, `style`, sizing and `xstyle`; the INNER styled region carries the
 * `astryx-section`/variant class, `data-variant`, background, dividers and the
 * padding cascade. Every case's structural assertions target those two divs
 * exactly as upstream does — `container.firstElementChild` is the outer, its
 * `firstElementChild` the inner.
 *
 * A single `section-probe` fixture supplies children, because a Svelte snippet
 * cannot be authored as a `render` prop the way React writes children inline.
 *
 * Two cases are counterparts rather than translations, each commented at its
 * site:
 *  - **forwards ref** — Svelte has no `ref` object; the outer element reaches a
 *    consumer through an attachment travelling in the rest props (which the port
 *    spreads onto the outer div). Asserting the received value is an
 *    `HTMLDivElement` checks more than upstream's, and preserves upstream's
 *    exact `toBeInstanceOf(HTMLDivElement)` form.
 *  - **accepts style prop** — Svelte's `style` is a string, not React's object,
 *    so `{opacity: 0.5}` becomes `'opacity: 0.5'`; the assertion
 *    (`root.style.opacity === '0.5'`) is upstream's verbatim.
 *
 * No case is dropped: all 20 have a counterpart here.
 */

const outerOf = (screen: { container: HTMLElement }): HTMLElement =>
	screen.container.firstElementChild as HTMLElement;

const innerOf = (screen: { container: HTMLElement }): HTMLElement =>
	outerOf(screen).firstElementChild as HTMLElement;

describe('Section', () => {
	it('renders with default props', async () => {
		const screen = await render(SectionProbe, { props: { text: 'Default section' } });
		expect(outerOf(screen)).toBeInTheDocument();
		await expect.element(screen.getByText('Default section')).toBeInTheDocument();
	});

	it('renders children', async () => {
		const screen = await render(SectionProbe, {
			props: { childTestid: 'child', text: 'Hello' }
		});
		await expect.element(screen.getByTestId('child')).toBeInTheDocument();
		await expect.element(screen.getByText('Hello')).toBeInTheDocument();
	});

	it('renders with variant="section" (default)', async () => {
		const screen = await render(SectionProbe, { props: { text: 'Content' } });
		const inner = innerOf(screen);
		expect(inner.className).toContain('astryx-section');
		expect(inner.className).toContain('section');
	});

	it('renders with variant="transparent"', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { variant: 'transparent' }, text: 'Content' }
		});
		const inner = innerOf(screen);
		expect(inner.className).toContain('astryx-section');
		expect(inner.className).toContain('transparent');
	});

	it('renders with variant="muted"', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { variant: 'muted' }, text: 'Content' }
		});
		const inner = innerOf(screen);
		expect(inner.className).toContain('astryx-section');
		expect(inner.className).toContain('muted');
	});

	it('renders with dividers', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { dividers: ['top', 'bottom'] }, text: 'Content' }
		});
		// The component should render without error
		expect(outerOf(screen)).toBeInTheDocument();
		await expect.element(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders with padding prop', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { padding: 2 }, text: 'Content' }
		});
		expect(outerOf(screen)).toBeInTheDocument();
		await expect.element(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders with width and height without error', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { width: 400, height: 300 }, text: 'Content' }
		});
		expect(outerOf(screen)).toBeInTheDocument();
		// Sizing is applied via stylex dynamic styles (CSS custom properties)
		// which aren't reflected in element.style in test environments
		await expect.element(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders with maxWidth and minHeight without error', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { maxWidth: 600, minHeight: 200 }, text: 'Content' }
		});
		expect(outerOf(screen)).toBeInTheDocument();
		await expect.element(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders with string size values without error', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { width: '50%', height: 'auto' }, text: 'Content' }
		});
		expect(outerOf(screen)).toBeInTheDocument();
		await expect.element(screen.getByText('Content')).toBeInTheDocument();
	});

	it('forwards ref', async () => {
		// Counterpart: Svelte has no `ref` object. The outer root reaches a
		// consumer through an attachment passed in the rest props, which the port
		// spreads onto the outer div. The received value being an `HTMLDivElement`
		// is upstream's exact assertion, checked against more (the element itself).
		const attached = vi.fn();
		const screen = await render(SectionProbe, {
			props: { props: { [createAttachmentKey()]: attached }, text: 'Content' }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
		expect(attached.mock.calls[0][0]).toBe(outerOf(screen));
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const screen = await render(SectionProbe, { props: { text: 'Content' } });
		const inner = innerOf(screen);
		expect(inner.className).toContain('astryx-section');
	});

	it('renders variant in astryx class names', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { variant: 'muted' }, text: 'Content' }
		});
		const inner = innerOf(screen);
		expect(inner.className).toContain('astryx-section');
		expect(inner.className).toContain('muted');
	});

	it('accepts xstyle prop without error', async () => {
		// xstyle is a StyleXStyles type; in tests stylex.create returns objects
		// that may not produce runtime styles, but the prop should be accepted
		const screen = await render(SectionProbe, {
			props: { props: { xstyle: undefined }, text: 'Content' }
		});
		expect(outerOf(screen)).toBeInTheDocument();
	});

	it('accepts className prop', async () => {
		// React's `className` is Svelte's `class`.
		const screen = await render(SectionProbe, {
			props: { props: { class: 'custom-class' }, text: 'Content' }
		});
		expect(outerOf(screen).className).toContain('custom-class');
	});

	it('accepts style prop', async () => {
		// Counterpart: Svelte's `style` is a string, not React's `{opacity: 0.5}`
		// object. The assertion on the resolved `style.opacity` is upstream's.
		const screen = await render(SectionProbe, {
			props: { props: { style: 'opacity: 0.5' }, text: 'Content' }
		});
		expect(outerOf(screen).style.opacity).toBe('0.5');
	});

	it('has two-div structure (outer + inner)', async () => {
		const screen = await render(SectionProbe, { props: { text: 'Content' } });
		const outer = outerOf(screen);
		const inner = innerOf(screen);
		expect(outer.tagName).toBe('DIV');
		expect(inner.tagName).toBe('DIV');
		// Children are inside the inner div
		expect(inner.textContent).toBe('Content');
	});

	it('spreads additional props', async () => {
		const screen = await render(SectionProbe, {
			props: { props: { 'data-testid': 'custom-section' }, text: 'Content' }
		});
		await expect.element(screen.getByTestId('custom-section')).toBeInTheDocument();
	});

	it('propagates explicit padding to nested sections via --astryx-section-padding', async () => {
		const screen = await render(SectionProbe, {
			props: {
				props: { padding: 6 },
				nested: { 'data-testid': 'inner' },
				nestedText: 'Inner'
			}
		});
		// Outer section's inner div should set --astryx-section-padding
		const outerInner = innerOf(screen);
		expect(outerInner.className).toBeDefined();
		// Inner section should render without error
		await expect.element(screen.getByTestId('inner')).toBeInTheDocument();
		await expect.element(screen.getByText('Inner')).toBeInTheDocument();
	});

	it('renders nested sections with explicit inner padding override', async () => {
		const screen = await render(SectionProbe, {
			props: {
				props: { padding: 6 },
				nested: { padding: 2, 'data-testid': 'inner' },
				nestedText: 'Inner'
			}
		});
		await expect.element(screen.getByTestId('inner')).toBeInTheDocument();
		await expect.element(screen.getByText('Inner')).toBeInTheDocument();
	});
});
