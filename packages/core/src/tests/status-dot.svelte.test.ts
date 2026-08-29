import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import StatusDot from '$lib/components/status-dot/status-dot.svelte';
import type { StatusDotProps } from '$lib/components/status-dot/status-dot.svelte';
import type { StatusDotVariant } from '$lib/components/status-dot/status-dot.stylex.js';
import SlotProbe from './fixtures/slot-probe.svelte';
import { atomicClasses, probe } from './fixtures/status-dot-probe.stylex.js';

/**
 * Astryx's `StatusDot/StatusDot.test.tsx`, ported case for case — **17 upstream
 * declarations at the 0.5.0 pin** (11 in `describe('StatusDot')`, 4 in `describe('custom
 * icon (parity with AvatarStatusDot)')` — one of them an `it.each` — 1 in
 * `describe('variant ink …')` and 1 in `describe('accessible name …')`),
 * **17 here, none dropped**. `StatusDot.test.tsx` is the only test file in
 * upstream's `StatusDot/` directory. There is no `displayName` case, no snapshot
 * and no no-JSX construction form, so `ref` is the only React-only surface and it
 * gets a counterpart.
 *
 * What translated, each commented where it appears:
 *
 * - **`forwards ref` is a counterpart.** Svelte has no `ref`; a consumer reaches
 *   the root through an attachment travelling in the rest props, which
 *   `StatusDot` spreads onto its `<span>`. It checks more than upstream's does —
 *   upstream only proves a callback ran with *some* `HTMLSpanElement`, this
 *   receives the span itself — so the `instanceof` is upstream's, unchanged.
 *
 * - **The `icon` cases go through `slot-probe.svelte`.** Upstream writes
 *   `icon={<Icon />}` inline; `icon` is a `Snippet` here (`port/debts.md`'s
 *   standing leaf-slot translation — the same one `Badge.label` records) and a
 *   snippet can only be authored in a template, so the shared slot fixture is the
 *   smallest thing that can hand one to `StatusDot`. It renders a `<span
 *   data-testid="custom-icon">` where upstream renders an `<svg>`; no case reads
 *   the tag.
 *
 * - **The `it.each` of non-renderable icons keeps its one declaration but runs
 *   two values, not five.** Upstream loops `[false, true, null, undefined, '']`
 *   because React's `icon` is a `ReactNode` and `cond && <Icon />` yields `false`;
 *   it guards them with `isRenderable()`. The Svelte type admits only
 *   `Snippet | undefined`, and `undefined` is exactly what `cond ? icon :
 *   undefined` — the Svelte spelling of that idiom — produces. `null` is kept
 *   beside it because the component's guard is `icon != null` and that is the
 *   half of upstream's set the guard actually has to cover. `false`, `true` and
 *   `''` are **not dropped cases**: they are values this component's prop type
 *   cannot hold, so there is nothing to assert about them.
 *
 * Restated, noted at the case:
 *
 * - **`renders at fixed 8px size`** asserts the 8px. Upstream's body only checks
 *   the dot is in the document — jsdom has no compiled StyleX to read, so its
 *   title has no assertion behind it. This project puts the real sheet on every
 *   browser test page (`setup-stylex.ts`), so the case can check what it claims.
 *
 * Runs in the **client** project: the size case reads a computed style, and the
 * variant-ink case compares against classes the real StyleX compiler emitted for
 * this page.
 */

/** Renders a StatusDot and returns its root element. Upstream's `renderDot`. */
async function renderDot(props: StatusDotProps): Promise<HTMLElement> {
	const screen = await render(StatusDot, { props });
	return screen.getByRole('img', { name: props.label, exact: true }).element() as HTMLElement;
}

const ICON_TESTID = 'custom-icon';

/**
 * Upstream's `renderDot({…, icon: <Icon />})`. The icon slot is filled by
 * `slot-probe.svelte` for the reason given in the file header; everything else
 * about the render is unchanged.
 */
async function renderDotWithIcon(props: { variant: StatusDotVariant; label: string }) {
	const screen = await render(SlotProbe, {
		props: {
			component: StatusDot,
			slot: 'icon',
			text: '',
			testid: ICON_TESTID,
			rest: props
		}
	});
	return {
		screen,
		dot: screen.getByRole('img', { name: props.label, exact: true }).element() as HTMLElement
	};
}

describe('StatusDot', () => {
	it('renders with role="img" and aria-label', async () => {
		const screen = await render(StatusDot, { props: { variant: 'success', label: 'Online' } });
		await expect
			.element(screen.getByRole('img', { name: 'Online', exact: true }))
			.toBeInTheDocument();
	});

	it('renders as a span element', async () => {
		const screen = await render(StatusDot, { props: { variant: 'success', label: 'Online' } });
		const dot = screen.getByRole('img', { name: 'Online', exact: true }).element();
		expect(dot.tagName).toBe('SPAN');
	});

	it('renders with all variant types', async () => {
		const variants = ['success', 'warning', 'error', 'accent', 'neutral'] as const;

		for (const variant of variants) {
			const screen = await render(StatusDot, { props: { variant, label: variant } });
			await expect
				.element(screen.getByRole('img', { name: variant, exact: true }))
				.toBeInTheDocument();
			await screen.unmount();
		}
	});

	it('renders at fixed 8px size', async () => {
		// RESTATED. Upstream's body is `expect(dot).toBeInTheDocument()` — jsdom
		// never applies the compiled StyleX sheet, so the 8px in the title is
		// unverifiable there. The browser project serves the real sheet, so the
		// dot's own geometry is readable and the case asserts it. Upstream's
		// presence check is kept as the first line.
		const screen = await render(StatusDot, { props: { variant: 'success', label: 'Online' } });
		const dot = screen.getByRole('img', { name: 'Online', exact: true }).element();
		expect(dot).toBeInTheDocument();
		const box = getComputedStyle(dot);
		expect(box.width).toBe('8px');
		expect(box.height).toBe('8px');
	});

	it('forwards ref', async () => {
		// COUNTERPART to upstream's `ref`: an attachment in the rest props, which
		// `StatusDot` spreads onto its root `<span>`. It receives the element
		// rather than only proving a callback ran, so the `instanceof` is
		// upstream's, unchanged.
		let node: Element | undefined;

		await render(StatusDot, {
			props: {
				variant: 'success',
				label: 'Online',
				[createAttachmentKey()]: (element: Element) => {
					node = element;
				}
			}
		});

		expect(node).toBeInstanceOf(HTMLSpanElement);
	});

	it('supports data-testid', async () => {
		const screen = await render(StatusDot, {
			props: { variant: 'success', label: 'Online', 'data-testid': 'status-dot' }
		});
		await expect.element(screen.getByTestId('status-dot')).toBeInTheDocument();
	});

	it('is not focusable', async () => {
		const screen = await render(StatusDot, { props: { variant: 'success', label: 'Online' } });
		const dot = screen.getByRole('img', { name: 'Online', exact: true }).element();
		expect(dot.getAttribute('tabindex')).toBeNull();
	});

	it('renders with isPulsing', async () => {
		const screen = await render(StatusDot, {
			props: { variant: 'success', label: 'Live', isPulsing: true }
		});
		await expect
			.element(screen.getByRole('img', { name: 'Live', exact: true }))
			.toBeInTheDocument();
	});

	it('renders without isPulsing by default', async () => {
		const screen = await render(StatusDot, { props: { variant: 'success', label: 'Online' } });
		await expect
			.element(screen.getByRole('img', { name: 'Online', exact: true }))
			.toBeInTheDocument();
	});

	it('renders with tooltip', async () => {
		const screen = await render(StatusDot, {
			props: { variant: 'success', label: 'Online', tooltip: 'Online' }
		});
		await expect
			.element(screen.getByRole('img', { name: 'Online', exact: true }))
			.toBeInTheDocument();
	});

	it('renders every variant as a plain childless dot by default (design review #4373)', async () => {
		// The dot is deliberately a colour-only signal by default — no built-in
		// per-variant glyph. Making the status accessible in context (label,
		// icon, or an accessible alternative) is the builder's responsibility;
		// see the usage guidance.
		const variants = ['success', 'warning', 'error', 'accent', 'neutral'] as const;
		for (const variant of variants) {
			const dot = await renderDot({ variant, label: `plain-${variant}` });
			expect(dot.childElementCount, variant).toBe(0);
		}
	});

	describe('custom icon (parity with AvatarStatusDot)', () => {
		it('renders a provided icon inside the dot', async () => {
			const { screen } = await renderDotWithIcon({ variant: 'success', label: 'Verified' });
			await expect.element(screen.getByTestId(ICON_TESTID)).toBeInTheDocument();
		});

		it('hides the icon wrapper from assistive tech (the label carries the status)', async () => {
			const { screen } = await renderDotWithIcon({ variant: 'success', label: 'Verified' });
			const iconEl = screen.getByTestId(ICON_TESTID).element();
			expect(iconEl.closest('[aria-hidden="true"]')).not.toBeNull();
		});

		// Two values rather than upstream's five — see the file header. `false`,
		// `true` and `''` are values a `Snippet | undefined` prop cannot hold, so
		// they are not dropped cases; `undefined` is what the Svelte spelling of
		// `cond && <Icon />` yields, and `null` is the other half of the
		// component's `icon != null` guard.
		it.each([undefined, null])(
			'ignores %s and keeps the plain dot (safe for `cond && <Icon />`)',
			async (value) => {
				const dot = await renderDot({
					variant: 'error',
					label: 'Offline',
					icon: value as undefined
				});
				expect(dot.childElementCount).toBe(0);
			}
		);

		it('keeps the accessible name on the dot when an icon renders', async () => {
			const { dot } = await renderDotWithIcon({ variant: 'success', label: 'Verified' });
			expect(dot).toHaveAttribute('role', 'img');
			expect(dot).toHaveAttribute('aria-label', 'Verified');
		});
	});

	describe('variant ink (a passed icon paints from currentColor)', () => {
		it('pairs the warning plate with the dedicated dark on-warning ink', async () => {
			// The regression this guards: a light surface ink on the yellow warning
			// plate lands near 2:1, while `--color-on-warning` is the fixed dark
			// ink (~9.6:1). An icon inherits the ink via `currentColor`, so the
			// pairing is what keeps custom icons legible.
			//
			// Upstream declares the `stylex.create` probe inline; StyleX may only be
			// imported from a `.ts`/`.stylex.ts` module here, so it lives in
			// `fixtures/status-dot-probe.stylex.ts` along with upstream's
			// `__`-debug-class filter. Nothing about the comparison changed.
			const dot = await renderDot({ variant: 'warning', label: 'Degraded' });
			const classes = atomicClasses(probe.warning);
			expect(classes.length).toBeGreaterThan(0);
			for (const cls of classes) {
				expect(dot.className).toContain(cls);
			}
		});
	});

	describe('accessible name (label reaches AT without hover)', () => {
		it('exposes the status label as the accessible name for every variant, without a tooltip', async () => {
			const variants = ['success', 'warning', 'error', 'accent', 'neutral'] as const;
			for (const variant of variants) {
				const screen = await render(StatusDot, {
					props: { variant, label: `Status: ${variant}` }
				});
				const dot = screen.getByRole('img', { name: `Status: ${variant}`, exact: true }).element();
				expect(dot).toHaveAttribute('aria-label', `Status: ${variant}`);
				// The name must not depend on hover or focus.
				expect(dot.getAttribute('tabindex')).toBeNull();
				await screen.unmount();
			}
		});
	});
});
