import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MobileNavProbe from './fixtures/mobile-nav-probe.svelte';

/**
 * Ported from Astryx's `MobileNav/MobileNav.test.tsx`, all 16 cases. Nothing is
 * dropped.
 *
 * ## Project
 *
 * The **client** project (real Chromium). `MobileNav` is a native `<dialog>`
 * driven through `showModal()`/`close()`, and the closed state is a computed
 * `display: none` coming out of the compiled StyleX sheet — neither exists in the
 * node project.
 *
 * ## Upstream's showModal/close mock, kept
 *
 * Upstream replaces `HTMLDialogElement.prototype.showModal`/`close` with
 * functions that only toggle the `open` attribute, because jsdom implements
 * neither. Chromium implements both, but the mock is kept for the same two
 * reasons `dialog.svelte.test.ts` and `lightbox.svelte.test.ts` keep it, and this
 * file follows that precedent: the `opens dialog via showModal` case needs to
 * observe the call, and the mock strips the real top-layer/focus side effects
 * upstream also strips, so the backdrop-click and cancel assertions test our
 * handlers rather than the UA's. It is installed per test and the originals
 * restored after, so it cannot leak into other suites.
 *
 * ## Translations
 *
 * - `fireEvent.click` becomes a native `element.click()`, as the dropdown-menu,
 *   dialog and lightbox suites already do — it dispatches a bubbling click whose
 *   `target` is the element itself, which is exactly what the backdrop-dismiss
 *   branch discriminates on.
 * - `screen.getByTestId(...)` on a **closed** drawer becomes a
 *   `container.querySelector`, because a closed `<dialog>` is `display: none` and
 *   Playwright's role/testid engines skip hidden nodes. Same shift the dialog
 *   suite documents.
 * - React's `rerender` is `screen.rerender`, which merges new props into the
 *   existing instance exactly as re-rendering a React element with new props does.
 *   The probe's prop bag is `navProps`, not the usual `props`, because
 *   `rerender({props: …})` is the deprecated legacy signature and unwraps that key
 *   — see the fixture.
 * - `className`/`style={{zIndex: 42}}` become Svelte's `class`/`style` string;
 *   the assertions on the resulting DOM are upstream's, unchanged.
 * - `getByText(…)` carries `{exact: true}`: Playwright's text engine is
 *   substring-and-case-insensitive by default where testing-library's is exact,
 *   so the option restores upstream's semantics rather than departing from them.
 *
 * ## Not tested here, deliberately
 *
 * `MobileNav`'s delayed `close()` (the slide-out transition) is **dead code on
 * both sides**: a Svelte effect, like a React one, runs its teardown before
 * re-running, so the teardown's unconditional `dialog.close()` has already fired
 * by the time the `isOpen: false` pass reaches the delayed branch. Upstream has
 * no case for it either, and inventing one would pin behaviour neither library
 * has. Recorded in port/todo.md → Known debts.
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

describe('MobileNav', () => {
	it('renders when isOpen is true', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop }, text: 'Nav content' }
		});
		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
		await expect.element(screen.getByText('Nav content', { exact: true })).toBeInTheDocument();
	});

	it('does not show dialog as open when isOpen is false', async () => {
		const screen = await render(MobileNavProbe, {
			props: {
				navProps: { isOpen: false, onOpenChange: noop, 'data-testid': 'mobile-nav' },
				text: 'Nav content'
			}
		});
		// The dialog element exists but is not open. A closed <dialog> is
		// display:none, so it is read out of the container rather than through a
		// testid query — see the header note.
		const dialog = screen.container.querySelector('[data-testid="mobile-nav"]');
		expect(dialog).toBeInTheDocument();
		expect(dialog).not.toHaveAttribute('open');
	});

	it('calls onOpenChange(false) on native cancel event (Escape)', async () => {
		const handleClose = vi.fn();
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: handleClose } }
		});

		// Native <dialog> fires a cancel event on Escape
		dialogIn(screen.container).dispatchEvent(
			new Event('cancel', { bubbles: false, cancelable: true })
		);
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it('calls onOpenChange(false) on backdrop click (click on dialog itself)', async () => {
		const handleClose = vi.fn();
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: handleClose, 'data-testid': 'mobile-nav' } }
		});

		// Click directly on the dialog element (the transparent overlay area)
		dialogIn(screen.container).click();
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it('does not close on drawer content click', async () => {
		const handleClose = vi.fn();
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: handleClose } }
		});

		(screen.getByText('Content', { exact: true }).element() as HTMLElement).click();
		expect(handleClose).not.toHaveBeenCalled();
	});

	it('renders close button', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop } }
		});

		await expect.element(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});

	it('calls onOpenChange(false) when close button is clicked', async () => {
		const handleClose = vi.fn();
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: handleClose } }
		});

		(screen.getByRole('button', { name: /close/i }).element() as HTMLElement).click();
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it('renders header string when provided', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop, header: 'Navigation' } }
		});

		await expect.element(screen.getByText('Navigation', { exact: true })).toBeInTheDocument();
	});

	it('forwards data-testid', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop, 'data-testid': 'custom-nav' } }
		});

		await expect.element(screen.getByTestId('custom-nav')).toBeInTheDocument();
	});

	it('forwards arbitrary pass-through attributes to the dialog', async () => {
		const screen = await render(MobileNavProbe, {
			props: {
				navProps: {
					isOpen: true,
					onOpenChange: noop,
					'data-testid': 'nav',
					id: 'main-nav',
					'data-custom': 'x',
					'aria-describedby': 'nav-desc'
				}
			}
		});

		const dialog = screen.getByTestId('nav');
		await expect.element(dialog).toHaveAttribute('id', 'main-nav');
		await expect.element(dialog).toHaveAttribute('data-custom', 'x');
		await expect.element(dialog).toHaveAttribute('aria-describedby', 'nav-desc');
	});

	it('applies a consumer className and style to the dialog', async () => {
		const screen = await render(MobileNavProbe, {
			props: {
				navProps: {
					isOpen: true,
					onOpenChange: noop,
					'data-testid': 'nav',
					class: 'consumer-class',
					style: 'z-index: 42'
				}
			}
		});

		const dialog = dialogIn(screen.container);
		expect(dialog.className).toContain('consumer-class');
		expect(dialog.style.zIndex).toBe('42');
	});

	it('composes a consumer onClick with the backdrop-dismiss handler', async () => {
		const onClick = vi.fn();
		const onOpenChange = vi.fn();
		const screen = await render(MobileNavProbe, {
			props: {
				navProps: { isOpen: true, onOpenChange, 'data-testid': 'nav', onclick: onClick }
			}
		});

		// Clicking the dialog element itself (the backdrop) dismisses AND calls the
		// consumer handler.
		dialogIn(screen.container).click();
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('uses native dialog element', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop, 'data-testid': 'mobile-nav' } }
		});

		const dialog = screen.container.querySelector('[data-testid="mobile-nav"]');
		expect(dialog?.tagName).toBe('DIALOG');
	});

	it('sets aria-label from header string', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop, header: 'My Nav' } }
		});

		await expect.element(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'My Nav');
	});

	it('defaults aria-label to Navigation when no header', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: true, onOpenChange: noop } }
		});

		await expect.element(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Navigation');
	});

	it('opens dialog via showModal when isOpen becomes true', async () => {
		const screen = await render(MobileNavProbe, {
			props: { navProps: { isOpen: false, onOpenChange: noop, 'data-testid': 'mobile-nav' } }
		});

		const dialog = dialogIn(screen.container);
		expect(dialog).not.toHaveAttribute('open');

		await screen.rerender({
			navProps: { isOpen: true, onOpenChange: noop, 'data-testid': 'mobile-nav' }
		});

		// `waitFor` rather than a bare assertion: the open/close effect runs in the
		// microtask after the prop lands, which is what React's `act`-wrapped
		// `rerender` was hiding. The mocked `showModal` is what sets the attribute,
		// so this *is* upstream's assertion that showModal ran.
		await vi.waitFor(() => {
			expect(dialog).toHaveAttribute('open');
		});
	});
});
