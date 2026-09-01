/** PORTS: AlertDialog/AlertDialog.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AlertDialog from '$lib/components/alert-dialog/alert-dialog.svelte';

/**
 * Ported from Astryx's `AlertDialog/AlertDialog.test.tsx` — **12 of its 31
 * cases at the 0.5.0 pin**.
 *
 * The 19 not here are four whole describes, none of them blocked on anything:
 * `keyboard` (5), `focus` (4), `aria` (4, counting its nested `the inline
 * preview path` pair) and the top-level `useImperativeAlertDialog` (6) that
 * shares upstream's file. They are portable — nothing in them is React-specific
 * — and every subject is ported here, so this is standing coverage debt rather
 * than a translation decision.
 *
 * (The header read "all 12 cases … Nothing is dropped" while upstream held 31,
 * and excused the `useImperativeAlertDialog` cases on the grounds that the hook
 * "has no test file of its own upstream — so no suite arrives with it either".
 * There is indeed no `useImperativeAlertDialog.test.tsx`, but its suite is a
 * top-level describe *inside* `AlertDialog.test.tsx`, so the suite does arrive
 * with it. The hook itself is ported.)
 *
 * Runs in the **client** (real Chromium) project, alongside `dialog.svelte.test.ts`
 * — `AlertDialog` is a `Dialog`, opened through `<dialog>.showModal()`. Upstream's
 * `showModal`/`close` `vi.fn` mock is kept for the same reason that suite keeps
 * it: it strips the real top-layer and focus side effects, so the assertions test
 * our own handlers. It is reinstalled per test and the originals restored after,
 * so it cannot leak into other suites sharing the browser page.
 *
 * `fireEvent.click(...)` becomes a native `.click()`, and the closed-dialog
 * `queryByRole` becomes a `container.querySelector` — a closed `<dialog>` is
 * `display: none`, which an accessibility-tree query cannot see. Every assertion
 * is upstream's.
 *
 * The sibling `useImperativeAlertDialog` is ported (`useImperativeAlertDialog` +
 * `<ImperativeAlertDialogLayer>`); its six upstream cases live in this same
 * upstream file and are among the 19 unported above. `Dialog`'s own
 * `useImperativeDialog` suite is a different file and is at
 * `use-imperative-dialog.svelte.test.ts`.
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
	vi.restoreAllMocks();
});

describe('AlertDialog', () => {
	const defaultProps = {
		isOpen: true,
		onOpenChange: vi.fn(),
		title: 'Delete item?',
		description: 'This action cannot be undone.',
		actionLabel: 'Delete',
		onAction: vi.fn()
	};

	/** The `role="alertdialog"` element, hidden or not. */
	function alertDialogIn(container: HTMLElement): HTMLElement | null {
		return container.querySelector('[role="alertdialog"]');
	}

	it('renders with alertdialog role', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps } });
		expect(alertDialogIn(screen.container)).toBeInTheDocument();
	});

	it('renders title and description', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps } });
		await expect.element(screen.getByText('Delete item?', { exact: true })).toBeInTheDocument();
		await expect
			.element(screen.getByText('This action cannot be undone.', { exact: true }))
			.toBeInTheDocument();
	});

	it('links title via aria-labelledby', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps } });
		const dialog = alertDialogIn(screen.container)!;
		const labelledBy = dialog.getAttribute('aria-labelledby');
		expect(labelledBy).toBeTruthy();
		expect(document.getElementById(labelledBy!)).toHaveTextContent('Delete item?');
	});

	it('links description via aria-describedby', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps } });
		const dialog = alertDialogIn(screen.container)!;
		const describedBy = dialog.getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
		expect(document.getElementById(describedBy!)).toHaveTextContent(
			'This action cannot be undone.'
		);
	});

	it('renders cancel and action buttons', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps } });
		await expect.element(screen.getByText('Cancel', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Delete', { exact: true })).toBeInTheDocument();
	});

	it('uses custom cancel label', async () => {
		const screen = await render(AlertDialog, {
			props: { ...defaultProps, cancelLabel: 'Never mind' }
		});
		await expect.element(screen.getByText('Never mind', { exact: true })).toBeInTheDocument();
	});

	it('calls onOpenChange(false) when cancel is clicked', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(AlertDialog, { props: { ...defaultProps, onOpenChange } });
		(screen.getByText('Cancel', { exact: true }).element() as HTMLElement).click();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('calls onAction when action is clicked', async () => {
		const onAction = vi.fn();
		const screen = await render(AlertDialog, { props: { ...defaultProps, onAction } });
		(screen.getByText('Delete', { exact: true }).element() as HTMLElement).click();
		expect(onAction).toHaveBeenCalled();
	});

	it('does not call onOpenChange when action is clicked', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(AlertDialog, { props: { ...defaultProps, onOpenChange } });
		(screen.getByText('Delete', { exact: true }).element() as HTMLElement).click();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('does not render when isOpen is false', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps, isOpen: false } });
		// The `<dialog>` stays in the DOM either way — upstream's `queryByRole`
		// returns null because a closed dialog is out of the accessibility tree,
		// not because the element is gone. Restated as the `open` assertion
		// `dialog.svelte.test.ts` uses for its own closed-state case.
		expect(alertDialogIn(screen.container)).not.toHaveAttribute('open');
	});

	it('accepts custom width', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps, width: 600 } });
		expect(alertDialogIn(screen.container)).toBeInTheDocument();
	});

	it('defaults cancel label to Cancel', async () => {
		const screen = await render(AlertDialog, { props: { ...defaultProps } });
		await expect.element(screen.getByText('Cancel', { exact: true })).toBeInTheDocument();
	});
});
