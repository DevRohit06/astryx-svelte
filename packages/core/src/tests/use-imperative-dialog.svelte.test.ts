import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ImperativeDialogProbe from './fixtures/imperative-dialog-probe.svelte';

/**
 * Ported from Astryx's `Dialog/useImperativeDialog.test.tsx`, all 5 cases.
 *
 * The suite was previously dropped in full, because `useImperativeDialog` was
 * deferred: its `element: ReactNode` return is a render-returning hook needing a
 * controller-plus-companion-component translation. Both halves now exist
 * (`useImperativeDialog` + `<ImperativeDialogLayer>`), so the suite is restored.
 *
 * ## Project
 *
 * The **client** project (real Chromium), for the same reason `dialog.svelte.test.ts`
 * is there: the hook renders a real `Dialog`, which opens through
 * `<dialog>.showModal()`.
 *
 * ## Determinism: upstream's showModal/close mock, kept verbatim
 *
 * Upstream's `beforeAll` replaces `HTMLDialogElement.prototype.showModal`/`close`
 * with `vi.fn`s because jsdom implements neither. A real browser implements both,
 * and the mock is kept for the reason `dialog.svelte.test.ts` records: it strips
 * the top-layer and focus side effects upstream also strips, so these cases test
 * the hook's state rather than the UA's modal machinery. It is installed per test
 * and the originals restored after, so it cannot leak into other suites sharing
 * the browser page — upstream's `beforeAll` has no such concern because jsdom
 * gives each file a fresh document.
 *
 * ## The two harnesses are one fixture
 *
 * Upstream declares `TestHarness` at module scope and `OptionsHarness` inside the
 * fifth case. They differ in two values (default options, and what `show()` is
 * called with), so the probe takes both as props. The rendered tree is
 * `TestHarness`'s exactly and a *superset* of `OptionsHarness`'s, which renders no
 * Close button — no case-5 locator can reach it (`Open Wide`, `status` and
 * `Wide content` are each unique), so nothing is lost, but the tree is not
 * literally identical for that one case.
 *
 * ## One upstream vacuity, named rather than repaired
 *
 * `can show with options` never asserts that the option *landed* — it checks
 * `isOpen` and the content text, both of which hold whether or not `show()`'s
 * second argument is merged in. The gap is in fact wider than that one case:
 * **no case here asserts any option at all**, including the `{width: 400}` the
 * other four construct the hook with, so replacing the whole `options` getter
 * with `{}` passes the suite. Both halves are upstream's own — its `TestHarness`
 * also passes `{width: 400}` and never asserts it — so the options path, the one
 * piece of real logic in the hook, is untested there too. Adding an assertion
 * would be coverage beyond upstream for a hazard that has an upstream analogue,
 * which this port's bar does not clear; the path is driven in a real browser
 * instead, where the four Dialog example blocks show widths of 400 and 480 and a
 * `maxHeight` of `50vh` all reaching the rendered dialog. Recorded here so the
 * gap is visible rather than mistaken for coverage.
 *
 * One further partial vacuity, also upstream's: `renders content when open` holds
 * whenever `content` is set, regardless of `isOpen`, because `Dialog` renders its
 * children inside the `<dialog>` unconditionally on both sides. It is a
 * content-rendering test in both repos, and it does discriminate on that.
 *
 * Nothing is dropped and nothing is added. `useImperativeAlertDialog` has no
 * upstream suite of its own, so its port adds no file here.
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

describe('useImperativeDialog', () => {
	it('starts closed', async () => {
		const screen = await render(ImperativeDialogProbe, {
			props: { defaultOptions: { width: 400 } }
		});
		await expect.element(screen.getByTestId('status')).toHaveTextContent('closed');
	});

	it('opens on show()', async () => {
		const screen = await render(ImperativeDialogProbe, {
			props: { defaultOptions: { width: 400 } }
		});
		await screen.getByText('Open').click();
		await expect.element(screen.getByTestId('status')).toHaveTextContent('open');
	});

	it('renders content when open', async () => {
		const screen = await render(ImperativeDialogProbe, {
			props: { defaultOptions: { width: 400 } }
		});
		await screen.getByText('Open').click();
		await expect.element(screen.getByText('Dialog content')).toBeInTheDocument();
	});

	it('closes on hide()', async () => {
		const screen = await render(ImperativeDialogProbe, {
			props: { defaultOptions: { width: 400 } }
		});
		await screen.getByText('Open').click();
		await expect.element(screen.getByTestId('status')).toHaveTextContent('open');
		await screen.getByText('Close').click();
		await expect.element(screen.getByTestId('status')).toHaveTextContent('closed');
	});

	it('can show with options', async () => {
		// Upstream's `OptionsHarness`: no default options, and `show()` carries
		// `{width: 720}`.
		const screen = await render(ImperativeDialogProbe, {
			props: { showOptions: { width: 720 }, openLabel: 'Open Wide', text: 'Wide content' }
		});
		await screen.getByText('Open Wide').click();
		await expect.element(screen.getByTestId('status')).toHaveTextContent('open');
		await expect.element(screen.getByText('Wide content')).toBeInTheDocument();
	});
});
