import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Thumbnail from '$lib/components/thumbnail/thumbnail.svelte';

/**
 * Upstream's `Thumbnail.test.tsx`, ported case for case.
 *
 * One case needed a counterpart rather than a translation. Upstream's last case
 * forwards a `ref` to the root; Svelte has no ref objects, and a component
 * cannot expose its root through `bind:this`, so the way a consumer reaches
 * that element is an attachment travelling through the rest props. That is what
 * is asserted — and it checks more than upstream's does, since it receives the
 * element rather than only proving the callback ran.
 *
 * All 24 upstream cases. The `fetch` stub earlier revisions carried is gone with
 * `useImageMode`: 0.1.9 replaced the sampled `<MediaTheme>` around the remove
 * button with a fixed scrim, so nothing here reads image pixels any more.
 *
 * The two load-failure cases are 0.3.0's. `fireEvent.error(img)` becomes a plain
 * `dispatchEvent(new Event('error'))` — there is no `fireEvent` here and none is
 * needed.
 */

/**
 * A 1×1 transparent GIF. Upstream can retry with a plain `/fixed.jpg` because
 * jsdom never fetches an image; a real browser does, and that fetch would 404
 * and fire a *second* `error` racing the assertion. The broken src stays a plain
 * path — there the failure is the point, and ours is dispatched synchronously.
 */
const LOADABLE_SRC =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('Thumbnail', () => {
	it('renders an image when src is provided', async () => {
		const screen = await render(Thumbnail, { props: { src: '/photo.jpg', alt: 'Test photo' } });
		const img = screen.container.querySelector('img')!;
		expect(img).toHaveAttribute('src', '/photo.jpg');
		expect(img).toHaveAttribute('alt', 'Test photo');
	});

	it('renders placeholder when no src is provided', async () => {
		const screen = await render(Thumbnail, { props: { 'data-testid': 'thumb' } });
		const root = screen.container.querySelector('[data-testid="thumb"]')!;
		expect(root.querySelector('svg')).not.toBeNull();
		expect(screen.container.querySelector('img')).toBeNull();
	});

	it('shows skeleton when isLoading with no src', async () => {
		const screen = await render(Thumbnail, { props: { isLoading: true, 'data-testid': 'thumb' } });
		expect(screen.container.querySelector('.astryx-skeleton')).not.toBeNull();
		expect(screen.container.querySelector('img')).toBeNull();
	});

	it('shows image with upload overlay when isLoading with src', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/local.jpg', alt: 'Uploading', isLoading: true, 'data-testid': 'thumb' }
		});
		expect(screen.container.querySelector('img')).toHaveAttribute('src', '/local.jpg');
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('exposes the label as an accessible name via a valid group role', async () => {
		const screen = await render(Thumbnail, {
			props: { label: 'photo.png', 'data-testid': 'thumb' }
		});
		// The accessible name must be carried by a valid named role (group), not
		// by a bare aria-label on a generic div (aria-prohibited-attr).
		const group = screen.getByRole('group', { name: 'photo.png', exact: true });
		await expect.element(group).toHaveAttribute('data-testid', 'thumb');
	});

	it('does not put aria-label on a generic (roleless) element', async () => {
		const screen = await render(Thumbnail, {
			props: { label: 'photo.png', 'data-testid': 'thumb' }
		});
		const thumb = screen.container.querySelector('[data-testid="thumb"]')!;
		expect(thumb).toHaveAttribute('role', 'group');
	});

	it('keeps interactive children accessible while exposing the group name', async () => {
		const screen = await render(Thumbnail, {
			props: {
				src: '/img.jpg',
				alt: 'Clickable',
				label: 'file.png',
				onclick: vi.fn(),
				onRemove: vi.fn()
			}
		});
		// A group role (unlike img) must not hide descendant controls.
		await expect
			.element(screen.getByRole('group', { name: 'file.png — Clickable', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Open file.png — Clickable', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Remove file.png — Clickable', exact: true }))
			.toBeInTheDocument();
	});

	it('marks the image as explicitly decorative when no alt is provided', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/photo.jpg', label: 'photo.png', 'data-testid': 'thumb' }
		});
		const img = screen.container.querySelector('[data-testid="thumb"] img');
		expect(img).toHaveAttribute('alt', '');
		expect(img).toHaveAttribute('role', 'presentation');
		expect(img).toHaveAttribute('aria-hidden', 'true');
		// The image must not be exposed to assistive technology as a nameless img.
		expect(screen.container.querySelector('[role="img"]')).toBeNull();
	});

	it('exposes the image with normal img semantics when alt is provided', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/photo.jpg', alt: 'Vacation photo' }
		});
		const img = screen.container.querySelector('img')!;
		expect(img).toHaveAttribute('alt', 'Vacation photo');
		expect(img).not.toHaveAttribute('role');
		expect(img).not.toHaveAttribute('aria-hidden');
	});

	it('warns once when src is set with no alt and no label', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Thumbnail, { props: { src: '/photo.jpg' } });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toContain('Thumbnail');
		warnSpy.mockRestore();
	});

	it('does not warn when the thumbnail is named via label or alt', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Thumbnail, { props: { src: '/a.jpg', label: 'a.png' } });
		await render(Thumbnail, { props: { src: '/b.jpg', alt: 'Photo b' } });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('label is shown via tooltip, not as inline text', async () => {
		const screen = await render(Thumbnail, {
			props: { label: 'photo.png', 'data-testid': 'thumb' }
		});
		const thumb = screen.container.querySelector('[data-testid="thumb"]')!;
		expect(thumb.textContent).not.toContain('photo.png');
	});

	it('calls onRemove when remove button is clicked', async () => {
		const onRemove = vi.fn();
		const screen = await render(Thumbnail, { props: { label: 'file.png', onRemove } });
		await userEvent.click(screen.getByRole('button', { name: 'Remove file.png', exact: true }));
		expect(onRemove).toHaveBeenCalledOnce();
	});

	it('calls onclick when thumbnail is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(Thumbnail, {
			props: { src: '/img.jpg', alt: 'Clickable', onclick }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Open Clickable', exact: true }));
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('does not render remove button when disabled', async () => {
		const screen = await render(Thumbnail, {
			props: { label: 'file.png', onRemove: vi.fn(), isDisabled: true }
		});
		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('does not render onclick button when disabled', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/img.jpg', alt: 'Test', onclick: vi.fn(), isDisabled: true }
		});
		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('is not interactive when isLoading', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/img.jpg', alt: 'Test', onclick: vi.fn(), isLoading: true }
		});
		expect(screen.container.querySelector('button')).toBeNull();
	});

	describe('showRemoveOn', () => {
		// The reveal style lives on the slot <div> that wraps the remove button
		// (ancestor-marker styles can't ride on a child component's xstyle prop),
		// so assert on the button's parent element.
		const removeSlotClass = async (showRemoveOn?: 'always' | 'hover') => {
			const view = await render(Thumbnail, {
				props: { label: 'file.png', onRemove: vi.fn(), showRemoveOn }
			});
			const slot = view
				.getByRole('button', { name: 'Remove file.png', exact: true })
				.element().parentElement!;
			return { className: slot.className, unmount: view.unmount };
		};

		it('renders the remove button in the DOM even when showRemoveOn="hover"', async () => {
			// Hover reveal is CSS-only (opacity) — the button must stay mounted so
			// it remains reachable by keyboard and assistive tech.
			const screen = await render(Thumbnail, {
				props: { label: 'file.png', onRemove: vi.fn(), showRemoveOn: 'hover' }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Remove file.png', exact: true }))
				.toBeInTheDocument();
		});

		it('applies a distinct slot class when showRemoveOn="hover" vs "always"', async () => {
			const always = await removeSlotClass('always');
			always.unmount();
			const hover = await removeSlotClass('hover');
			expect(hover.className).not.toBe(always.className);
		});

		it('defaults to "hover" (same slot class as an explicit hover)', async () => {
			const def = await removeSlotClass(undefined);
			def.unmount();
			const hover = await removeSlotClass('hover');
			expect(def.className).toBe(hover.className);
		});

		it('still fires onRemove when revealed on hover', async () => {
			const onRemove = vi.fn();
			const screen = await render(Thumbnail, {
				props: { label: 'file.png', onRemove, showRemoveOn: 'hover' }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Remove file.png', exact: true }));
			expect(onRemove).toHaveBeenCalledOnce();
		});
	});

	it('shows the placeholder when the image fails to load', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/broken.jpg', alt: 'Broken', 'data-testid': 'thumb' }
		});
		// Upstream's `fireEvent.error`. `act()` has no counterpart — the `$state`
		// write flushes on its own, which `tick()` waits for.
		screen.container.querySelector('img')!.dispatchEvent(new Event('error'));
		await tick();

		expect(screen.container.querySelector('img')).toBeNull();
		const root = screen.container.querySelector('[data-testid="thumb"]')!;
		expect(root.querySelector('svg')).not.toBeNull();
	});

	it('retries a changed src after a load error', async () => {
		const screen = await render(Thumbnail, {
			props: { src: '/broken.jpg', alt: 'Photo', 'data-testid': 'thumb' }
		});
		screen.container.querySelector('img')!.dispatchEvent(new Event('error'));
		await tick();
		expect(screen.container.querySelector('img')).toBeNull();

		// A different src must get a fresh load attempt, not the stale error.
		await screen.rerender({ src: LOADABLE_SRC });

		expect(screen.container.querySelector('img')).toHaveAttribute('src', LOADABLE_SRC);
	});

	it('hands the root element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(Thumbnail, {
			props: { 'data-testid': 'thumb', [createAttachmentKey()]: attached }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('[data-testid="thumb"]'));
	});
});
