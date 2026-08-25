import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import FieldStatus from '$lib/components/field-status/field-status.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import { testStyles } from './fixtures/field-status-xstyle.stylex.js';

/**
 * Astryx's `FieldStatus/FieldStatus.test.tsx`, ported case for case — **34**
 * `it` declarations upstream at the **0.5.0** pin, **33** of them here. One is
 * dropped, and it is named below. Upstream's file is unchanged between v0.4.5 —
 * where this header last stated the count — and 0.5.0.
 *
 * `Field/Field.test.tsx` and `Field/FieldLabel.test.tsx` are ported in
 * `field.svelte.test.ts`; neither touches `FieldStatus`'s own markup, so nothing
 * here duplicates that file. `switch.svelte.test.ts` asserts the live region
 * from `Switch`'s side (`announces a status message that appears after mount`),
 * which is upstream's arrangement too — that case belongs to `Switch.test.tsx`.
 *
 * Dropped:
 * - **`exposes a displayName for devtools` (`:450`).** Svelte components have no
 *   `displayName` — a `.svelte` module's default export is a component
 *   constructor with no such surface, and nothing in devtools reads one. There
 *   is no assertion to restate, so the case is left out rather than turned into
 *   a check of something else.
 *
 * Translated, not dropped (each is marked at the case):
 * - **`forwards a ref to the root element` (`:201`)** → an attachment passed
 *   through rest props, which `field-status.svelte` spreads onto its root
 *   `<div>`. This asserts *more* than upstream's `expect(ref).toHaveBeenCalled
 *   With(expect.any(HTMLDivElement))`: the attachment receives the actual root
 *   element, so the case pins identity as well as element type.
 * - **`rerender`** maps straight across — `vitest-browser-svelte`'s is async and
 *   merges props rather than replacing them, so each rerender restates the full
 *   prop set to keep upstream's second render literal.
 * - **`waitFor`** is `vi.waitFor`. The live regions are plain DOM nodes found by
 *   `document.querySelector`, not locators, so `expect.element`'s retry does not
 *   apply and upstream's explicit wait is kept. It is load-bearing in both
 *   ports: `announceMessage` clears the region and re-sets its text inside a
 *   `requestAnimationFrame`, so the text is never there synchronously.
 *
 * Upstream's `testStyles` (`:18-20`) lives in
 * `fixtures/field-status-xstyle.stylex.ts` — StyleX may not be imported from a
 * module the Svelte plugin will parse, and a `.stylex.ts` fixture is how every
 * other `xstyle` case in this repo gets a compiled style.
 *
 * The two region helpers and the `afterEach` reset are upstream's, verbatim.
 */

/** Upstream's helper, verbatim. */
function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

/** Upstream's helper, verbatim. */
function assertiveRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="assertive"]');
}

afterEach(() => {
	__resetLiveRegionsForTest();
});

describe('FieldStatus', () => {
	it('renders the message text', async () => {
		const screen = await render(FieldStatus, {
			props: { type: 'error', message: 'This field is required' }
		});
		await expect.element(screen.getByText('This field is required')).toBeInTheDocument();
	});

	it('renders the message inside a <div>', async () => {
		const screen = await render(FieldStatus, {
			props: { type: 'error', message: 'Boom', 'data-testid': 'fs' }
		});
		expect(screen.getByTestId('fs').element().tagName).toBe('DIV');
	});

	describe('screen-reader announcements', () => {
		// The rendered element is NOT itself a live region: FieldStatus is
		// conditionally mounted by every caller, and live regions born together
		// with their content are not reliably announced. Announcements go through
		// the persistent useAnnounce singletons instead.
		it('does not carry role or aria-live on the rendered element', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			const el = screen.getByTestId('fs').element();
			expect(el).not.toHaveAttribute('role');
			expect(el).not.toHaveAttribute('aria-live');
		});

		// Errors are urgent — they interrupt via the assertive channel.
		it('announces error messages assertively, including on first mount', async () => {
			await render(FieldStatus, {
				props: { type: 'error', message: 'This field is required' }
			});
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('This field is required');
			});
			expect(politeRegion()).toHaveTextContent('');
		});

		it('announces warning messages politely', async () => {
			await render(FieldStatus, { props: { type: 'warning', message: 'Check this value' } });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Check this value');
			});
			expect(assertiveRegion()).toHaveTextContent('');
		});

		it('announces success messages politely', async () => {
			await render(FieldStatus, { props: { type: 'success', message: 'Looks good' } });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Looks good');
			});
		});

		it('announces message changes', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'First' } });
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('First');
			});
			await screen.rerender({ type: 'error', message: 'Second' });
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('Second');
			});
		});

		// Severity changes re-route the announcement to the matching channel.
		it('re-routes to the polite channel when type changes from error', async () => {
			const screen = await render(FieldStatus, { props: { type: 'error', message: 'msg' } });
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('msg');
			});
			await screen.rerender({ type: 'success', message: 'msg' });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('msg');
			});
		});

		it('does not announce an empty message', async () => {
			await render(FieldStatus, { props: { type: 'error', message: '' } });
			// The live regions are created lazily on first announce; an empty
			// message must not trigger one.
			expect(assertiveRegion()).toBeNull();
			expect(politeRegion()).toBeNull();
		});

		// The visible message stays perceivable by assistive tech (it is the
		// aria-describedby target for the input).
		it('does not mark itself aria-hidden', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element()).not.toHaveAttribute('aria-hidden');
		});
	});

	describe('theme class + data attribute reflection', () => {
		it('renders the stable astryx-field-status class', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element()).toHaveClass('astryx-field-status');
		});

		it('reflects the type as a class token and data-type attribute', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'warning', message: 'msg', 'data-testid': 'fs' }
			});
			const el = screen.getByTestId('fs').element();
			expect(el).toHaveClass('warning');
			expect(el).toHaveAttribute('data-type', 'warning');
		});

		it('reflects the variant as a class token and data-variant attribute', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'detached', 'data-testid': 'fs' }
			});
			const el = screen.getByTestId('fs').element();
			expect(el).toHaveClass('detached');
			expect(el).toHaveAttribute('data-variant', 'detached');
		});

		it('defaults data-variant to "attached"', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			const el = screen.getByTestId('fs').element();
			expect(el).toHaveAttribute('data-variant', 'attached');
			expect(el).toHaveClass('attached');
		});
	});

	describe('color styling per status type', () => {
		// Each status type maps to a distinct color treatment. The rendered class
		// list must therefore differ between types — a regression that collapsed
		// them onto one color would be caught here.
		it('applies distinct StyleX classes for each type', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			const errorClass = screen.getByTestId('fs').element().getAttribute('class');

			await screen.rerender({ type: 'warning', message: 'msg', 'data-testid': 'fs' });
			const warningClass = screen.getByTestId('fs').element().getAttribute('class');

			await screen.rerender({ type: 'success', message: 'msg', 'data-testid': 'fs' });
			const successClass = screen.getByTestId('fs').element().getAttribute('class');

			expect(errorClass).not.toEqual(warningClass);
			expect(warningClass).not.toEqual(successClass);
			expect(errorClass).not.toEqual(successClass);
		});

		it('applies distinct StyleX classes for each variant', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'attached', 'data-testid': 'fs' }
			});
			const attachedClass = screen.getByTestId('fs').element().getAttribute('class');

			await screen.rerender({
				type: 'error',
				message: 'msg',
				variant: 'detached',
				'data-testid': 'fs'
			});
			const detachedClass = screen.getByTestId('fs').element().getAttribute('class');

			expect(attachedClass).not.toEqual(detachedClass);
		});
	});

	describe('prop forwarding', () => {
		// Upstream's `forwards a ref to the root element`. Svelte has no `ref`
		// prop; the counterpart is an attachment in the rest props, which
		// `field-status.svelte` spreads onto its root `<div>`. It receives the
		// element itself, so this pins identity on top of upstream's type check.
		it('forwards an attachment to the root element', async () => {
			const attached = vi.fn();
			const screen = await render(FieldStatus, {
				props: {
					type: 'error',
					message: 'msg',
					[createAttachmentKey()]: (node: Element) => attached(node)
				}
			});
			expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
			expect(screen.container.firstElementChild).toBeInstanceOf(HTMLDivElement);
		});

		it('applies the id attribute', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', id: 'email-error', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element()).toHaveAttribute('id', 'email-error');
		});

		it('passes through arbitrary DOM props', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs', 'data-custom': 'xyz' }
			});
			expect(screen.getByTestId('fs').element()).toHaveAttribute('data-custom', 'xyz');
		});

		it('merges a consumer className with the stable class', async () => {
			// Upstream's `className`; Svelte spells it `class`.
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', class: 'my-status', 'data-testid': 'fs' }
			});
			const el = screen.getByTestId('fs').element();
			expect(el).toHaveClass('my-status');
			expect(el).toHaveClass('astryx-field-status');
		});

		it('merges a consumer inline style', async () => {
			// Upstream's `style={{marginTop: '10px'}}`; Svelte's `style` is a string.
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', style: 'margin-top: 10px', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element()).toHaveStyle({ marginTop: '10px' });
		});

		it('applies an xstyle as an extra class', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			const withoutXstyle = screen.getByTestId('fs').element().getAttribute('class');

			// xstyle values are compiled StyleX styles; passing one adds classes.
			await screen.rerender({
				type: 'error',
				message: 'msg',
				'data-testid': 'fs',
				xstyle: testStyles.custom
			});
			const withXstyle = screen.getByTestId('fs').element().getAttribute('class');
			expect(withXstyle).not.toEqual(withoutXstyle);
		});
	});

	describe('dynamic updates', () => {
		it('updates the rendered message on rerender', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'First', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element()).toHaveTextContent('First');

			await screen.rerender({ type: 'error', message: 'Second', 'data-testid': 'fs' });
			expect(screen.getByTestId('fs').element()).toHaveTextContent('Second');
		});

		// The element must never regain live-region semantics when the type
		// changes — announcements always flow through the persistent regions.
		it('keeps the element role-free when type changes from error', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element()).not.toHaveAttribute('role');

			await screen.rerender({ type: 'success', message: 'msg', 'data-testid': 'fs' });
			const el = screen.getByTestId('fs').element();
			expect(el).not.toHaveAttribute('role');
			expect(el).not.toHaveAttribute('aria-live');
		});
	});

	// The detached message must convey status by more than color/position:
	// a leading status glyph precedes the message text (WCAG 1.4.1). The glyph
	// is decorative for AT (aria-hidden) because the message text already names
	// the status in words and it is announced via the live region.
	describe('detached leading status icon (use-of-color a11y)', () => {
		it('renders a leading status icon before the message for the detached variant', async () => {
			const screen = await render(FieldStatus, {
				props: {
					type: 'error',
					message: 'Something went wrong',
					variant: 'detached',
					'data-testid': 'fs'
				}
			});
			const el = screen.getByTestId('fs').element();
			const icon = el.querySelector('[aria-hidden="true"]');
			const text = screen.getByText('Something went wrong').element();
			expect(icon).toBeInTheDocument();
			// Icon comes before the message text in document order.
			expect(icon!.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});

		it('marks the status icon aria-hidden (visual redundancy, not a second announcement)', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'warning', message: 'Heads up', variant: 'detached', 'data-testid': 'fs' }
			});
			const icon = screen.getByTestId('fs').element().querySelector('[aria-hidden="true"]');
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveAttribute('aria-hidden', 'true');
		});

		it('renders a status icon for each status type in the detached variant', async () => {
			for (const type of ['error', 'warning', 'success'] as const) {
				const screen = await render(FieldStatus, {
					props: { type, message: 'msg', variant: 'detached', 'data-testid': 'fs' }
				});
				expect(
					screen.getByTestId('fs').element().querySelector('[aria-hidden="true"]')
				).toBeInTheDocument();
				screen.unmount();
			}
		});

		it('does not render a leading status icon for the attached variant', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'attached', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element().querySelector('[aria-hidden="true"]')).toBeNull();
		});
	});

	describe('field-status-icon theme target', () => {
		// The stable theme target lands on the detached message box's leading glyph
		// itself, so a theme can restyle (e.g. resize) just this icon via
		// `defineTheme`. It reflects the status type as a data attribute so themes
		// can target per status, mirroring the parent astryx-field-status.
		const getStatusIcon = (root: Element): HTMLElement => {
			const icon = root.querySelector('.astryx-field-status-icon');
			if (icon == null) {
				throw new Error('status icon not found');
			}
			return icon as HTMLElement;
		};

		it('renders the target on the detached leading icon', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'detached', 'data-testid': 'fs' }
			});
			const icon = getStatusIcon(screen.getByTestId('fs').element());
			expect(icon).toHaveClass('astryx-field-status-icon');
			expect(icon).toHaveClass('astryx-icon');
			expect(icon).toHaveAttribute('data-type', 'error');
		});

		it('reflects the status type per status', async () => {
			for (const type of ['error', 'warning', 'success'] as const) {
				const screen = await render(FieldStatus, {
					props: { type, message: 'msg', variant: 'detached', 'data-testid': 'fs' }
				});
				expect(getStatusIcon(screen.getByTestId('fs').element())).toHaveAttribute(
					'data-type',
					type
				);
				screen.unmount();
			}
		});

		it('does not render the target for the attached variant', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: 'msg', variant: 'attached', 'data-testid': 'fs' }
			});
			expect(
				screen.getByTestId('fs').element().querySelector('.astryx-field-status-icon')
			).toBeNull();
		});
	});

	describe('edge cases', () => {
		it('renders an empty message without crashing', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'error', message: '', 'data-testid': 'fs' }
			});
			const el = screen.getByTestId('fs').element();
			expect(el).toBeInTheDocument();
			expect(el).toHaveTextContent('');
		});

		it('renders message content verbatim, including whitespace-only strings', async () => {
			const screen = await render(FieldStatus, {
				props: { type: 'warning', message: '   ', 'data-testid': 'fs' }
			});
			expect(screen.getByTestId('fs').element().textContent).toBe('   ');
		});
	});
});
