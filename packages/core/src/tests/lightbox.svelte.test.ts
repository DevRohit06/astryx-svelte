/** PORTS: Lightbox/Lightbox.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Lightbox from '$lib/components/lightbox/lightbox.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';

/**
 * Ported from Astryx's `Lightbox/Lightbox.test.tsx`, all 37 cases at the 0.5.0
 * pin.
 *
 * ## Project
 *
 * The **client** project (real Chromium). `Lightbox` drives a native `<dialog>`,
 * and its screen-reader announcements go through `useAnnounce`, which sets the
 * live region's text inside a `requestAnimationFrame` — neither is available in
 * the node project, and rAF in particular has to be the real one for the six
 * announcement cases to observe what a browser would.
 *
 * ## Upstream's showModal/close mock, kept
 *
 * Upstream replaces `HTMLDialogElement.prototype.showModal`/`close` with `vi.fn`s
 * that only toggle the `open` attribute, because jsdom implements neither. Real
 * Chromium implements both, but the mock is kept here for the same two reasons
 * `dialog.svelte.test.ts` keeps it, and this file follows that precedent: the
 * `calls showModal when isOpen becomes true` case needs a spy to assert *that*
 * it was called, and the mock strips the top-layer/focus side effects upstream
 * also strips, so the assertions test our handlers rather than the UA's. It is
 * reinstalled per test (fresh call counts) and the originals restored after, so
 * it cannot leak into the other suites sharing the browser page.
 *
 * ## Translations
 *
 * `fireEvent.click` / `fireEvent.keyDown` become a native `element.click()` / a
 * dispatched bubbling `KeyboardEvent`, as in the dropdown-menu and dialog
 * suites. `waitFor` becomes `vi.waitFor`, which retries identically.
 * `document.querySelector('dialog')` is read out of the render container rather
 * than the document, so a stray node from another suite can never satisfy it.
 * React's `rerender` is `screen.rerender`, which merges the new props into the
 * existing instance exactly as re-rendering a React element with new props does.
 *
 * Upstream's hard-coded English announcement strings (`"<alt>, N of M"` /
 * `"Image N of M"`) are asserted verbatim: the port replicates upstream's choice
 * not to route those two through the translator.
 *
 * React's `fireEvent` flushes inside `act`, so upstream reads the resulting
 * attribute on the very next line. A Svelte `$state` write applied from a
 * dispatched event has not reached the DOM by then, so the zoom/pan assertions
 * use the retrying forms — `expect.element` for attributes, `expect.poll` for
 * the transform — and the one *negative* assertion (nothing zoomed when
 * `hasZoom` is off) awaits `tick()` first, because a retrying matcher would let
 * it pass for the wrong reason.
 *
 * ## Cases that changed shape
 *
 * - `forwards ref to dialog element` → **counterpart**. This port has no `ref`
 *   prop (no `mergeRefs` idiom here); the `<dialog>` reaches a consumer through
 *   an attachment passed in rest props, which `Lightbox` spreads onto it.
 *   Asserting the received node *is* an `HTMLDialogElement` checks more than
 *   upstream's `ref.current` assertion, which only proves a callback ran.
 * - `does not render caption when not provided` → **restated**; see the case.
 * - `has no zoom target or key bindings when hasZoom is off` → **restated**
 *   (one assertion): upstream's `document.querySelector('[aria-pressed]')` is
 *   read out of the render container instead, so a toggle button left mounted by
 *   another suite sharing this browser page cannot fail it.
 * - `does not close when the media itself is clicked` → **restated** (the query
 *   only): `getByRole('img', {hidden: true})` becomes `getByAltText`, which is
 *   how the rest of this file reaches the image and needs no a11y-tree
 *   visibility caveat.
 *
 * The zoom announcements assert only upstream's substrings ("Zoomed in" /
 * "Zoomed out"); the full catalog messages are longer here, and asserting the
 * substring is what upstream asserts.
 *
 * Nothing is dropped.
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

// useAnnounce mounts singleton live regions on <body>; reset between tests so
// stale announcements from one test don't leak into the next.
afterEach(() => {
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
	__resetLiveRegionsForTest();
});

const noop = (): void => {};

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

const dialogIn = (container: HTMLElement): HTMLDialogElement => {
	const el = container.querySelector('dialog');
	if (!(el instanceof HTMLDialogElement)) throw new Error('expected a <dialog> element');
	return el;
};

const press = (el: Element, key: string): void => {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
};

describe('Lightbox', () => {
	it('renders as a dialog element', async () => {
		const screen = await render(Lightbox, {
			props: {
				isOpen: false,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'Photo' }
			}
		});
		const dialog = screen.container.querySelector('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('calls showModal when isOpen becomes true', async () => {
		await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'Photo' }
			}
		});
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
	});

	it('renders the image with correct src and alt', async () => {
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'A beautiful photo' }
			}
		});
		const img = screen.getByAltText('A beautiful photo');
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).toHaveAttribute('src', '/photo.jpg');
	});

	it('renders caption when provided', async () => {
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				media: {
					src: '/photo.jpg',
					alt: 'Photo',
					caption: 'Sunset over the ocean'
				}
			}
		});
		await expect
			.element(screen.getByText('Sunset over the ocean', { exact: true }))
			.toBeInTheDocument();
	});

	it('does not render caption when not provided', async () => {
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'Photo' }
			}
		});
		expect(screen.container.querySelectorAll('[class*="caption"]').length).toBe(0);
		// RESTATED (second assertion only): StyleX compiles the caption wrapper's
		// class to hashed atomic names with no literal "caption" substring, so
		// upstream's selector cannot discriminate here — it would pass even if a
		// caption rendered. The caption is the media group's second child, next to
		// the image wrapper; with no caption the group holds the wrapper alone.
		const img = screen.container.querySelector('img');
		const mediaGroup = img?.parentElement?.parentElement;
		expect(mediaGroup?.children.length).toBe(1);
	});

	it('calls onOpenChange(false) when close button is clicked', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange,
				media: { src: '/photo.jpg', alt: 'Photo' }
			}
		});
		const closeButton = screen.getByLabelText('Close', { exact: true }).element() as HTMLElement;
		closeButton.click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('calls onOpenChange(false) on Escape via cancel event', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange,
				media: { src: '/photo.jpg', alt: 'Photo' }
			}
		});
		const dialog = dialogIn(screen.container);
		const cancelEvent = new Event('cancel', { cancelable: true });
		dialog.dispatchEvent(cancelEvent);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('sets aria-label on the dialog', async () => {
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'Beach sunset' }
			}
		});
		expect(dialogIn(screen.container)).toHaveAttribute('aria-label', 'Beach sunset');
	});

	it('forwards ref to dialog element', async () => {
		// COUNTERPART: no `ref` prop in this port — the element reaches a consumer
		// through an attachment in rest props, which `Lightbox` spreads onto the
		// `<dialog>`. See the header note.
		const attached = vi.fn();
		const screen = await render(Lightbox, {
			props: {
				isOpen: false,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'Photo' },
				[createAttachmentKey()]: attached
			}
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLDialogElement);
		expect(attached.mock.calls[0][0]).toBe(dialogIn(screen.container));
	});

	describe('gallery mode', () => {
		const media = [
			{ src: '/a.jpg', alt: 'Image A', caption: 'First' },
			{ src: '/b.jpg', alt: 'Image B', caption: 'Second' },
			{ src: '/c.jpg', alt: 'Image C' }
		];

		it('renders the image at the given index', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1 }
			});
			await expect.element(screen.getByAltText('Image B')).toBeInTheDocument();
		});

		it('shows gallery counter', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 0 }
			});
			await expect.element(screen.getByText('1 / 3', { exact: true })).toBeInTheDocument();
		});

		it('shows prev/next buttons for middle item', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1 }
			});
			await expect.element(screen.getByLabelText('Previous', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByLabelText('Next', { exact: true })).toBeInTheDocument();
		});

		it('keeps prev mounted and disabled on first item', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 0 }
			});
			// The Prev button stays mounted at the range boundary (disabled) rather
			// than unmounting, so navigating to the first item never removes the
			// focused control and drops focus to <body>.
			const prev = screen.getByLabelText('Previous', { exact: true });
			await expect.element(prev).toBeInTheDocument();
			await expect.element(prev).toBeDisabled();
			await expect.element(screen.getByLabelText('Next', { exact: true })).not.toBeDisabled();
		});

		it('keeps next mounted and disabled on last item', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 2 }
			});
			const next = screen.getByLabelText('Next', { exact: true });
			await expect.element(next).toBeInTheDocument();
			await expect.element(next).toBeDisabled();
			await expect.element(screen.getByLabelText('Previous', { exact: true })).not.toBeDisabled();
		});

		it('does not drop focus to <body> when navigating to the last item', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1 }
			});
			// Simulate arriving at the final item (Next becomes disabled).
			await screen.rerender({ index: 2 });
			// Both nav buttons remain in the DOM; the dialog stays available so
			// keyboard gallery navigation isn't dead-ended.
			await expect.element(screen.getByLabelText('Previous', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByLabelText('Next', { exact: true })).toBeInTheDocument();
			const dialog = screen.container.querySelector('dialog');
			expect(dialog).toBeInTheDocument();
			// Arrow handling is on the dialog, so navigation still works at the edge.
			const onIndexChange = vi.fn();
			await screen.rerender({ onIndexChange });
			if (dialog instanceof HTMLElement) {
				press(dialog, 'ArrowLeft');
			}
			expect(onIndexChange).toHaveBeenCalledWith(1);
		});

		it('calls onIndexChange when next is clicked', async () => {
			const onIndexChange = vi.fn();
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 0, onIndexChange }
			});
			(screen.getByLabelText('Next', { exact: true }).element() as HTMLElement).click();
			expect(onIndexChange).toHaveBeenCalledWith(1);
		});

		it('calls onIndexChange when prev is clicked', async () => {
			const onIndexChange = vi.fn();
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 2, onIndexChange }
			});
			(screen.getByLabelText('Previous', { exact: true }).element() as HTMLElement).click();
			expect(onIndexChange).toHaveBeenCalledWith(1);
		});

		it('navigates via arrow keys', async () => {
			const onIndexChange = vi.fn();
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1, onIndexChange }
			});
			const dialog = dialogIn(screen.container);
			press(dialog, 'ArrowRight');
			expect(onIndexChange).toHaveBeenCalledWith(2);
			press(dialog, 'ArrowLeft');
			expect(onIndexChange).toHaveBeenCalledWith(0);
		});
	});

	describe('screen-reader announcements', () => {
		const media = [
			{ src: '/a.jpg', alt: 'Image A', caption: 'First' },
			{ src: '/b.jpg', alt: 'Image B', caption: 'Second' },
			{ src: '/c.jpg', alt: 'Image C' }
		];

		it('announces the new image and position when navigating next via button', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, defaultIndex: 0 }
			});
			(screen.getByLabelText('Next', { exact: true }).element() as HTMLElement).click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Image B, 2 of 3');
			});
		});

		it('announces the new image and position when navigating via arrow keys', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, defaultIndex: 1 }
			});
			const dialog = dialogIn(screen.container);
			press(dialog, 'ArrowRight');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Image C, 3 of 3');
			});
		});

		it('announces the new image and position when navigating prev', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, defaultIndex: 2 }
			});
			(screen.getByLabelText('Previous', { exact: true }).element() as HTMLElement).click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Image B, 2 of 3');
			});
		});

		it('falls back to a positional label when the image has no alt', async () => {
			const unlabeled = [
				{ src: '/a.jpg', alt: 'Image A' },
				{ src: '/b.jpg', alt: '' }
			];
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media: unlabeled, defaultIndex: 0 }
			});
			(screen.getByLabelText('Next', { exact: true }).element() as HTMLElement).click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Image 2 of 2');
			});
		});

		it('does not announce on initial open', async () => {
			await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, defaultIndex: 1 }
			});
			// Allow any scheduled rAF to flush; nothing should have been announced.
			await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
			// The dialog's aria-label already names the current image on open, so no
			// live region is created (announce is never called).
			expect(politeRegion()).toBeNull();
		});

		it('does not announce when the lightbox opens at a new index', async () => {
			const screen = await render(Lightbox, {
				props: { isOpen: false, onOpenChange: noop, media, index: 0 }
			});
			await screen.rerender({ isOpen: true, index: 2 });
			await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
			expect(politeRegion()).toBeNull();
		});
	});

	describe('keyboard zoom and pan', () => {
		const media = [
			{ src: '/a.jpg', alt: 'Image A' },
			{ src: '/b.jpg', alt: 'Image B' },
			{ src: '/c.jpg', alt: 'Image C' }
		];

		it('exposes the image as a focusable zoom toggle when hasZoom is on', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/photo.jpg', alt: 'Photo' },
					hasZoom: true
				}
			});
			const target = screen.getByRole('button', { name: 'Zoom', exact: true });
			await expect.element(target).toHaveAttribute('tabindex', '0');
			await expect.element(target).toHaveAttribute('aria-pressed', 'false');
		});

		it('toggles zoom with Enter on the image', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/photo.jpg', alt: 'Photo' },
					hasZoom: true
				}
			});
			const target = screen.getByRole('button', { name: 'Zoom', exact: true });
			press(target.element(), 'Enter');
			await expect.element(target).toHaveAttribute('aria-pressed', 'true');
			press(target.element(), 'Enter');
			await expect.element(target).toHaveAttribute('aria-pressed', 'false');
		});

		it('toggles zoom with Space on the image', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/photo.jpg', alt: 'Photo' },
					hasZoom: true
				}
			});
			const target = screen.getByRole('button', { name: 'Zoom', exact: true });
			press(target.element(), ' ');
			await expect.element(target).toHaveAttribute('aria-pressed', 'true');
			press(target.element(), ' ');
			await expect.element(target).toHaveAttribute('aria-pressed', 'false');
		});

		it('zooms in with + and out with - from anywhere in the dialog', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/photo.jpg', alt: 'Photo' },
					hasZoom: true
				}
			});
			const dialog = dialogIn(screen.container);
			const target = screen.getByRole('button', { name: 'Zoom', exact: true });
			press(dialog, '+');
			await expect.element(target).toHaveAttribute('aria-pressed', 'true');
			press(dialog, '-');
			await expect.element(target).toHaveAttribute('aria-pressed', 'false');
			// `=` (unshifted `+` on most layouts) also zooms in.
			press(dialog, '=');
			await expect.element(target).toHaveAttribute('aria-pressed', 'true');
		});

		it('pans with arrow keys while zoomed instead of navigating the gallery', async () => {
			const onIndexChange = vi.fn();
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1, onIndexChange, hasZoom: true }
			});
			const dialog = dialogIn(screen.container);
			const target = screen.getByRole('button', { name: 'Zoom', exact: true }).element();
			press(target, 'Enter');
			const img = screen.getByAltText('Image B').element();
			// The transform rides a `--x-transform` custom property (StyleX's dynamic
			// style), so it reads out of the `style` attribute exactly as upstream's
			// inline `transform` does.
			const transform = (): string => img.getAttribute('style') ?? '';
			await expect.poll(transform).toContain('translate(0px, 0px)');
			// ArrowRight reveals content to the right (image shifts left) and must
			// not fall through to gallery navigation.
			press(dialog, 'ArrowRight');
			expect(onIndexChange).not.toHaveBeenCalled();
			await expect.poll(transform).toContain('translate(-25px, 0px)');
			press(dialog, 'ArrowDown');
			await expect.poll(transform).toContain('translate(-25px, -25px)');
			press(dialog, 'ArrowLeft');
			press(dialog, 'ArrowUp');
			await expect.poll(transform).toContain('translate(0px, 0px)');
			expect(onIndexChange).not.toHaveBeenCalled();
		});

		it('navigates the gallery with arrows when not zoomed, even with hasZoom', async () => {
			const onIndexChange = vi.fn();
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1, onIndexChange, hasZoom: true }
			});
			press(dialogIn(screen.container), 'ArrowRight');
			expect(onIndexChange).toHaveBeenCalledWith(2);
		});

		it('announces zoom state changes politely', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/photo.jpg', alt: 'Photo' },
					hasZoom: true
				}
			});
			const target = screen.getByRole('button', { name: 'Zoom', exact: true }).element();
			press(target, 'Enter');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Zoomed in');
			});
			press(target, 'Enter');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Zoomed out');
			});
		});

		it('has no zoom target or key bindings when hasZoom is off', async () => {
			const onIndexChange = vi.fn();
			const screen = await render(Lightbox, {
				props: { isOpen: true, onOpenChange: noop, media, index: 1, onIndexChange }
			});
			expect(screen.getByRole('button', { name: 'Zoom', exact: true }).elements()).toHaveLength(0);
			const dialog = dialogIn(screen.container);
			press(dialog, '+');
			// `tick()` so this is a real observation rather than one that passes
			// because no update had been applied yet — the negative assertions are
			// the ones a retrying matcher cannot make honest.
			await tick();
			// RESTATED (container-scoped): upstream reads this off `document`, which
			// in this shared browser page could match a toggle from another suite.
			expect(screen.container.querySelector('[aria-pressed]')).toBeNull();
			// Arrows still navigate the gallery.
			press(dialog, 'ArrowRight');
			expect(onIndexChange).toHaveBeenCalledWith(2);
		});

		it('does not expose a zoom target for video items', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/clip.mp4', alt: 'A clip', type: 'video' as const },
					hasZoom: true
				}
			});
			expect(screen.getByRole('button', { name: 'Zoom', exact: true }).elements()).toHaveLength(0);
		});
	});

	describe('video support', () => {
		it('renders a video element when type is video', async () => {
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange: noop,
					media: { src: '/clip.mp4', alt: 'A clip', type: 'video' as const }
				}
			});
			const video = screen.container.querySelector('video');
			expect(video).toBeInTheDocument();
			expect(video).toHaveAttribute('src', '/clip.mp4');
			expect(video).toHaveAttribute('controls');
		});
	});

	it('does not crash with an empty media array', async () => {
		const screen = await render(Lightbox, {
			props: { isOpen: true, onOpenChange: noop, media: [] }
		});
		expect(screen.container.querySelector('dialog')).not.toBeInTheDocument();
	});

	describe('backdrop dismiss', () => {
		it('calls onOpenChange(false) when the dark area around the media is clicked', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange,
					media: { src: '/photo.jpg', alt: 'Photo' }
				}
			});
			// The container fills the whole dialog, so a click on the visual backdrop
			// (the dark area around the media) lands on it — not on the dialog
			// element itself.
			const container = dialogIn(screen.container).firstElementChild;
			(container as HTMLElement).click();
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('does not close when the media itself is clicked', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Lightbox, {
				props: {
					isOpen: true,
					onOpenChange,
					media: { src: '/photo.jpg', alt: 'Photo' }
				}
			});
			// RESTATED (the query only): `getByAltText` is how the rest of this file
			// reaches the image; upstream's `getByRole('img', {hidden: true})` names
			// the same element.
			(screen.getByAltText('Photo').element() as HTMLElement).click();
			expect(onOpenChange).not.toHaveBeenCalled();
		});
	});
});
