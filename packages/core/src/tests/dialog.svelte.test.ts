import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { resolveDialogPositionOffsets } from '$lib/components/dialog/dialog.stylex.js';
import DialogProbe from './fixtures/dialog-probe.svelte';

/**
 * Ported from Astryx's `Dialog/Dialog.test.tsx` — **34 of its 44 cases at the
 * 0.5.0 pin.**
 *
 * The 10 not here are four whole describes, all added after the 0.3.0 pin this
 * header last stated a count against: `IME composition` (2), `nested-modal
 * dismissal` (4), `responsive sizing` (3) and `container padding isolation` (1)
 * — composition-guarded Escape, top-layer ordering across stacked modals,
 * viewport/safe-area clamping, and the container-query padding reset. No case
 * outside those blocks is missing.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "all 25 cases" and "nothing is dropped". Both were
 * false: upstream stood at **30** at v0.2.0, and the five-case `accessible name`
 * block (upstream #4000, landed well before 0.2.0) had never been ported, even
 * though the feature it covers had been. Those five are backfilled below and
 * flagged where they sit. 0.3.0 then added four more — one `position` case for
 * the logical pair and the three-case `resolveDialogPositionOffsets` block —
 * bringing both sides to 34.
 *
 * ## `DialogPosition` is logical-only as of 0.3.0
 *
 * The physical `left`/`right` fields this suite used to pass are **gone**
 * upstream: #4568 added logical `start`/`end` and deprecated the physical pair,
 * then #4657 (`chore: remove deprecated APIs`) deleted it — both between the
 * v0.2.0 and v0.3.0 tags. The two pre-existing `position prop` cases were
 * rewritten to `end`/`start` exactly as upstream rewrote them, not merely to keep
 * compiling.
 *
 * ## Project
 *
 * This is the **client** project (real Chromium), where every other modal- and
 * focus-driven suite lives — `Dialog` opens through `<dialog>.showModal()`, moves
 * focus, and its `DialogHeader` autofocuses via an effect, none of which jsdom
 * models. `DialogHeader`'s own suite asserts real focus, so both belong here.
 *
 * ## Determinism: upstream's showModal/close mock, kept verbatim
 *
 * Upstream replaces `HTMLDialogElement.prototype.showModal`/`close` with `vi.fn`s
 * that merely toggle the `open` attribute — jsdom implements neither. A real
 * browser implements both, but keeping the mock is the faithful choice here for
 * two reasons: it is the only way to assert *that* `showModal` was called (the
 * `calls showModal` / `does not call showModal` cases need a spy), and it strips
 * the real top-layer/focus side effects that upstream also strips, so the Escape
 * and focus assertions test our own handlers rather than the UA's. The mock is
 * reinstalled per test (fresh call counts) and the originals restored after, so
 * it cannot leak into other suites sharing the browser page.
 *
 * ## Query shifts (following the earlier client suites)
 *
 * A closed `<dialog>` is `display: none`, so a role query would have to opt into
 * hidden nodes to see it; upstream's `getByRole('dialog', {hidden: true})` and
 * `queryByRole(...)` become `container.querySelector`, exactly as the tooltip and
 * overlay suites resolve their hidden layers. Every assertion is upstream's.
 *
 * No case here has a React-only surface (no `ref`, no `displayName`), so nothing
 * is dropped. The sibling `useImperativeDialog.test.tsx` suite lives in
 * `use-imperative-dialog.svelte.test.ts` (5/5); it used to be dropped in full
 * while that hook was deferred.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
});

afterEach(() => {
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
});

const noop = (): void => {};

const dialogIn = (container: HTMLElement): HTMLDialogElement => {
	const el = container.querySelector('dialog');
	if (!(el instanceof HTMLDialogElement)) throw new Error('expected a <dialog> element');
	return el;
};

describe('Dialog', () => {
	it('renders when isOpen is true', async () => {
		const screen = await render(DialogProbe, {
			props: { props: { isOpen: true, onOpenChange: noop }, text: 'Dialog content' }
		});
		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		await expect.element(screen.getByText('Dialog content')).toBeInTheDocument();
	});

	it('calls showModal when opened', async () => {
		await render(DialogProbe, { props: { props: { isOpen: true, onOpenChange: noop } } });
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
	});

	it('does not show when isOpen is false', async () => {
		const screen = await render(DialogProbe, {
			props: { props: { isOpen: false, onOpenChange: noop }, text: 'Hidden content' }
		});
		// A closed dialog is display:none, so it is read out of the container
		// directly rather than through a role query — see the header note.
		expect(dialogIn(screen.container)).not.toHaveAttribute('open');
	});

	it('has aria-modal attribute', async () => {
		const screen = await render(DialogProbe, {
			props: { props: { isOpen: true, onOpenChange: noop } }
		});
		await expect.element(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
	});

	describe('purpose: info (default)', () => {
		it('calls onOpenChange(false) when Escape is pressed', async () => {
			const handleHide = vi.fn();
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: handleHide, purpose: 'info' } }
			});
			dialogIn(screen.container).dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
			);
			expect(handleHide).toHaveBeenCalledTimes(1);
		});
	});

	describe('purpose: form', () => {
		it('calls onOpenChange(false) when Escape is pressed', async () => {
			const handleHide = vi.fn();
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: handleHide, purpose: 'form' } }
			});
			dialogIn(screen.container).dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
			);
			expect(handleHide).toHaveBeenCalledTimes(1);
		});
	});

	describe('purpose: required', () => {
		it('does not call onOpenChange when Escape is pressed', async () => {
			const handleHide = vi.fn();
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: handleHide, purpose: 'required' } }
			});
			dialogIn(screen.container).dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
			);
			expect(handleHide).not.toHaveBeenCalled();
		});

		it('prevents default on cancel event', async () => {
			const handleHide = vi.fn();
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: handleHide, purpose: 'required' } }
			});
			const cancelEvent = new Event('cancel', { cancelable: true });
			dialogIn(screen.container).dispatchEvent(cancelEvent);
			expect(cancelEvent.defaultPrevented).toBe(true);
			expect(handleHide).not.toHaveBeenCalled();
		});
	});

	describe('variant: standard', () => {
		it('renders with default variant', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop } }
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('accepts custom width', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, width: 600 } }
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('accepts custom maxHeight', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, maxHeight: '50vh' } }
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	describe('variant: fullscreen', () => {
		it('renders fullscreen variant', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, variant: 'fullscreen' } }
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	describe('position prop', () => {
		it('accepts position configuration', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, position: { top: 100, end: 20 } } }
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('handles string position values', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: true, onOpenChange: noop, position: { top: '10vh', start: '5vw' } }
				}
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('accepts logical start/end position configuration', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: true, onOpenChange: noop, position: { top: 100, start: 20, end: 40 } }
				}
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	// Logical mapping is verified against the pure resolver so we can assert the
	// exact emitted CSS offsets without relying on StyleX class compilation or a
	// browser. Upstream titles this block "(physical-vs-logical mapping)" and keeps
	// the phrase from the release where `DialogPosition` still carried deprecated
	// physical `left`/`right`; v0.3.0 removed those (upstream #4657) and the block
	// now covers the logical pair only. The title is upstream's verbatim.
	//
	// Upstream imports `resolveDialogPositionOffsets` from `./Dialog`; here it lives
	// in `dialog.stylex.ts` beside the `stylex.create` literal it feeds, so the import
	// is the deep `$lib` path. It is deliberately NOT on the package barrel, matching
	// upstream's "not re-exported from the package; internal to Dialog".
	describe('resolveDialogPositionOffsets (physical-vs-logical mapping)', () => {
		it('maps logical start/end to inset-inline offsets (mirror under RTL)', () => {
			// insetInlineStart/End are direction-relative: the browser resolves them
			// to left/right per `dir`, so the same value mirrors under RTL.
			const offsets = resolveDialogPositionOffsets({ start: 20, end: 40 });
			expect(offsets.insetInlineStart).toBe('20px');
			expect(offsets.insetInlineEnd).toBe('40px');
			// No physical offsets requested → auto.
		});

		it('combines block-axis top/bottom with an inline pair', () => {
			const offsets = resolveDialogPositionOffsets({ top: 100, start: 12 });
			expect(offsets.top).toBe('100px');
			expect(offsets.insetInlineStart).toBe('12px');
			// Everything unset falls back to auto.
			expect(offsets.bottom).toBe('auto');
			expect(offsets.insetInlineEnd).toBe('auto');
		});

		it('passes through string offsets (vw/vh/etc.) for logical offsets', () => {
			const logical = resolveDialogPositionOffsets({ start: '5vw', end: '10%' });
			expect(logical.insetInlineStart).toBe('5vw');
			expect(logical.insetInlineEnd).toBe('10%');
		});
	});

	it('forwards additional props to dialog element', async () => {
		const screen = await render(DialogProbe, {
			props: { props: { isOpen: true, onOpenChange: noop, 'data-testid': 'custom-dialog' } }
		});
		await expect.element(screen.getByTestId('custom-dialog')).toBeInTheDocument();
	});

	it('does not forward native open prop to dialog element', async () => {
		const screen = await render(DialogProbe, {
			props: { props: { isOpen: false, onOpenChange: noop, open: true } }
		});
		// isOpen=false controls state; native open prop must not leak through.
		expect(dialogIn(screen.container)).not.toHaveAttribute('open');
	});

	describe('alertdialog role', () => {
		it('sets role="alertdialog" when purpose is "required"', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, purpose: 'required' } }
			});
			await expect.element(screen.getByRole('alertdialog')).toBeInTheDocument();
		});

		it('does not set role="alertdialog" when purpose is "info"', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, purpose: 'info' } }
			});
			expect(screen.container.querySelector('[role="alertdialog"]')).toBeNull();
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('does not set role="alertdialog" when purpose is "form"', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop, purpose: 'form' } }
			});
			expect(screen.container.querySelector('[role="alertdialog"]')).toBeNull();
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	// Backfilled: upstream has carried this block since #4000 (pre-0.2.0) and this
	// suite never had it — the header claimed "all 25 cases" and "nothing is
	// dropped" while upstream stood at 30. The feature itself was ported (the
	// `aria-labelledby` attachment + the unnamed-dialog dev warning in
	// `dialog.svelte`); only its coverage was missing.
	describe('accessible name', () => {
		it('is labelled by the DialogHeader title by default', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: true, onOpenChange: noop },
					body: 'header',
					headerTitle: 'Dialog title'
				}
			});
			const dialog = screen.getByRole('dialog');
			const heading = screen.getByRole('heading', { name: 'Dialog title' });
			const headingEl = heading.element() as HTMLElement;
			expect(headingEl.id).not.toBe('');
			await expect.element(dialog).toHaveAttribute('aria-labelledby', headingEl.id);
			await expect.element(dialog).toHaveAccessibleName('Dialog title');
		});

		it('prefers a consumer-provided aria-label over the header title', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: true, onOpenChange: noop, 'aria-label': 'Custom name' },
					body: 'header',
					headerTitle: 'Dialog title'
				}
			});
			const dialog = screen.getByRole('dialog');
			await expect.element(dialog).not.toHaveAttribute('aria-labelledby');
			await expect.element(dialog).toHaveAccessibleName('Custom name');
		});

		it('prefers a consumer-provided aria-labelledby over the header title', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: true, onOpenChange: noop, 'aria-labelledby': 'external-label' },
					body: 'header',
					headerTitle: 'Dialog title',
					externalLabel: 'External name'
				}
			});
			const dialog = screen.getByRole('dialog');
			await expect.element(dialog).toHaveAttribute('aria-labelledby', 'external-label');
			await expect.element(dialog).toHaveAccessibleName('External name');
		});

		it('omits aria-labelledby and warns when open with no name source', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const screen = await render(DialogProbe, {
					props: { props: { isOpen: true, onOpenChange: noop }, text: 'Content' }
				});
				const dialog = screen.getByRole('dialog');
				await expect.element(dialog).not.toHaveAttribute('aria-labelledby');
				await vi.waitFor(() => {
					expect(warnSpy).toHaveBeenCalledTimes(1);
				});
				expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('accessible name'));
			} finally {
				warnSpy.mockRestore();
			}
		});

		it('does not warn when the header provides a title', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const screen = await render(DialogProbe, {
					props: {
						props: { isOpen: true, onOpenChange: noop },
						body: 'header',
						headerTitle: 'Dialog title'
					}
				});
				await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
				expect(warnSpy).not.toHaveBeenCalled();
			} finally {
				warnSpy.mockRestore();
			}
		});
	});

	describe('inner flex wrapper', () => {
		it('wraps children in a flex container for scroll support', async () => {
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop }, body: 'child', text: 'Content' }
			});
			const child = screen.getByTestId('child').element() as HTMLElement;
			const wrapper = child.parentElement!;
			expect(wrapper.tagName).toBe('DIV');
			expect(wrapper.parentElement!.tagName).toBe('DIALOG');
		});
	});

	describe('edge compensation isolation', () => {
		it('does not inherit edge compensation from ancestor containers', async () => {
			// With container-driven edge compensation (via :has() + data attributes),
			// dialogs no longer need to reset CSS custom properties — the compensation
			// is scoped to each container's own slot wrappers.
			const screen = await render(DialogProbe, {
				props: { props: { isOpen: true, onOpenChange: noop }, body: 'child', text: 'Content' }
			});
			await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	describe('isInline', () => {
		it('renders children in a div without a <dialog> element', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: true, isInline: true, onOpenChange: noop },
					body: 'child',
					text: 'Inline content'
				}
			});
			await expect.element(screen.getByText('Inline content')).toBeInTheDocument();
			expect(screen.container.querySelector('dialog')).toBeNull();
		});

		it('renders nothing when isOpen is false', async () => {
			const screen = await render(DialogProbe, {
				props: {
					props: { isOpen: false, isInline: true, onOpenChange: noop },
					body: 'child',
					text: 'Hidden content'
				}
			});
			expect(screen.container.textContent).not.toContain('Hidden content');
			expect(screen.container.querySelector('dialog')).toBeNull();
		});

		it('does not call showModal', async () => {
			await render(DialogProbe, {
				props: { props: { isOpen: true, isInline: true, onOpenChange: noop } }
			});
			expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
		});

		it('suppresses DialogHeader auto-focus', async () => {
			const before = document.createElement('button');
			before.type = 'button';
			document.body.appendChild(before);
			before.focus();

			await render(DialogProbe, {
				props: { props: { isOpen: true, isInline: true, onOpenChange: noop }, body: 'header' }
			});

			expect(document.activeElement).toBe(before);
			before.remove();
		});
	});
});
