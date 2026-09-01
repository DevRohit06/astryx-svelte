/** PORTS: Toast/ToastViewport.test.tsx */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/toast-viewport-harness.svelte';
import EffectDispatch from './fixtures/toast-effect-dispatch.svelte';
import { __resetLiveRegionsForTest, type AnnouncePoliteness } from '$lib/hooks/use-announce.js';
import type { ToastOptions } from '$lib/components/toast/types.js';

/**
 * Ported from Astryx's `Toast/ToastViewport.test.tsx` at the **0.5.2** pin —
 * upstream declares **55**, and **14** are here.
 *
 * **The count moved 13 -> 55 with the pin.** 0.5.1 added swipe dismissal and
 * rewrote the viewport's geometry, and the bulk of the 41 not here is its
 * `describe('Toast swipe dismissal')` block, which fires pen pointer events at
 * the `[data-type]` card and asserts on the `--_toast-swipe-*` custom
 * properties. `use-toast-gesture.ts` is ported and writes exactly those
 * properties on exactly that element, so the block is portable — it is not
 * done, not blocked.
 *
 * What is missing is the swipe-dismissal block and the viewport geometry cases
 * 0.5.1 added; `port/status.md`'s case delta carries the size of it.
 *
 * The region-ARIA pair at the end is upstream's own 0.5.1 split: the landmark is
 * now gated on there being something to announce, so an empty viewport exposes
 * no region at all. Ours asserted the region unconditionally and timed out
 * against the gate — the header's count had expired along with its assumptions. Two cases are restated, each
 * for the reason given above it: "pauses the auto-hide timer while the window is
 * blurred", and (new in 0.3.0) "announces exactly once at dispatch".
 *
 * The sibling `Toast/useToast.test.tsx` (4 cases) still lives in
 * `use-toast.svelte.test.ts`.
 *
 * ## Announcements: the sink is observed, not a mocked module
 *
 * Upstream wraps `useAnnounce` with `vi.mock` so every call lands on a spy while
 * the real singleton regions still fill. That is avoided here: the client
 * project's setup file imports the whole `$lib` barrel, so `use-announce.js` is
 * already in the module graph before any test file runs, and a hoisted module
 * mock would have to invalidate it transitively. `recordAnnouncements()` watches
 * the regions themselves instead — the exact sink upstream's spy feeds. One
 * announce writes one non-empty text node (the hook clears the region, then sets
 * the message on the next frame), so the recorded `[message, politeness]` pairs
 * are the same evidence the spy provides, one step closer to the DOM.
 *
 * `__resetLiveRegionsForTest()` runs after every case: the regions outlive each
 * render, so text from one case would otherwise leak into the next.
 *
 * ## Live regions make body-wide text queries ambiguous
 *
 * A toast's text now appears twice in `document.body` — in the toast, and in the
 * polite/assertive region on `<body>`. `screen.getByText(...)` is page-wide, so
 * the F6 case scopes its toast-text assertion with `screen.locator` (this repo's
 * `within(container)`, documented in `date-input.svelte.test.ts`). The blur-timer
 * case already read `screen.container.textContent`, which excludes the regions,
 * and every other case queries trigger labels or button roles.
 *
 * ## Project
 *
 * Client (real Chromium). Every case turns on `document.activeElement`, a real
 * focus ring inside a `position: fixed` viewport, and — for the two timer cases
 * — a DOM whose CSS transitions actually exist. The suite would be testing jsdom
 * otherwise.
 *
 * ## Upstream's `beforeAll` popover polyfill: dropped
 *
 * Upstream stubs `HTMLElement.prototype.showPopover`/`hidePopover` because jsdom
 * implements neither. Chromium implements both natively, and every case here
 * renders with `isTopLayer={false}` (upstream's own choice), so the viewport
 * never calls them at all. Keeping the stub would fake an API that is real here
 * and unused by the suite either way.
 *
 * ## `renderHook`'s absence, and `act()`'s
 *
 * `useToast()` must run during component init, so upstream's `ShowToastButton`
 * becomes a fixture verbatim (`fixtures/show-toast-button.svelte`) and
 * `renderViewport(children)` becomes `fixtures/toast-viewport-harness.svelte`,
 * which takes the trigger list as data. `act()` disappears — a `$state` write
 * flushes on its own; where a case needs the DOM *and effects* settled before it
 * reads `document.activeElement`, `await tick()` stands in.
 *
 * ## Clicks are synchronous on purpose
 *
 * Upstream's `fireEvent.click` dispatches a click without moving focus, which is
 * load-bearing in cases 1 and 3 (the trigger must stay focused so F6 has
 * somewhere to return to) and in case 6 (two dismissals inside one exit window).
 * `HTMLElement.click()` is the exact equivalent; the browser-driver `.click()`
 * of `vitest-browser-svelte` is a real mouse press and would move focus and
 * interleave frames.
 *
 * ## Fake timers
 *
 * Only `setTimeout`/`clearTimeout`, as in this repo's `useLongPress` port:
 * Vitest's default set includes `queueMicrotask`, which is what Svelte schedules
 * its flush on, so faking everything stalls mount. `Date.now()` therefore stays
 * real, which only means `pauseTimer` books a few real milliseconds of elapsed
 * time against `remaining` — well inside the margins both timer cases advance
 * by. Under fake timers the assertions are synchronous DOM reads rather than
 * `expect.element`, whose retry loop would have nothing to run on.
 */

// Module-level constant default props, as upstream (its `EMPTY_OPTIONS` lives in
// the fixture, since a Svelte default is written at the destructure).
const INFO_A: ToastOptions = { body: 'Toast A' };
const INFO_B: ToastOptions = { body: 'Toast B' };
const AUTO_TOAST: ToastOptions = { body: 'Auto toast', autoHideDuration: 3000 };

function renderViewport(triggers: { options?: ToastOptions; triggerLabel?: string }[]) {
	return render(Harness, { props: { triggers } });
}

// Fire the transition-end that ToastViewport listens for to unmount an exiting
// toast. Chromium *does* run the real transition, but on real time — these cases
// must not wait for it, and case 4/7 run under fake timers where the exit would
// still take real wall-clock milliseconds.
function completeExit(toastId: string): void {
	const node = document.querySelector<HTMLElement>(`[data-toast-id="${toastId}"]`);
	if (node) {
		node.dispatchEvent(
			new TransitionEvent('transitionend', {
				propertyName: 'grid-template-rows',
				bubbles: true,
				cancelable: true
			})
		);
	}
}

function toastIds(): string[] {
	return [...document.querySelectorAll('[data-toast-id]')].map(
		(node) => node.getAttribute('data-toast-id') as string
	);
}

function dismissButtons(): HTMLElement[] {
	return [...document.querySelectorAll<HTMLElement>('button[aria-label="Dismiss notification"]')];
}

/** A recorded announcement: the message and the region it reached. */
type AnnounceRecord = [message: string, politeness: AnnouncePoliteness];

/**
 * Records every announcement that reaches `useAnnounce`'s singleton live
 * regions — see the file header for why this stands in for upstream's
 * `vi.mock`ed spy. The regions do not exist until the first announce, so the
 * observer watches `document.body`'s subtree and filters to them.
 */
function recordAnnouncements(): { calls: AnnounceRecord[]; stop: () => void } {
	const calls: AnnounceRecord[] = [];
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			const region = record.target;
			if (!(region instanceof HTMLElement)) continue;
			const politeness = region.getAttribute('data-astryx-live-region');
			if (politeness !== 'polite' && politeness !== 'assertive') continue;
			for (const node of record.addedNodes) {
				const text = node.textContent ?? '';
				if (text) calls.push([text, politeness]);
			}
		}
	});
	observer.observe(document.body, { subtree: true, childList: true });
	return { calls, stop: () => observer.disconnect() };
}

function regionText(politeness: AnnouncePoliteness): string {
	return document.querySelector(`[data-astryx-live-region="${politeness}"]`)?.textContent ?? '';
}

/**
 * Waits long enough for an announcement to have landed (or provably not to
 * have): the hook sets the message on the frame after the dispatch, and the
 * MutationObserver callback runs as a microtask after that.
 */
async function settleAnnouncements(): Promise<void> {
	await tick();
	for (let i = 0; i < 3; i++) {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	}
	await tick();
}

afterEach(() => {
	vi.useRealTimers();
	__resetLiveRegionsForTest();
});

describe('ToastViewport keyboard reach + focus', () => {
	it('F6 moves focus into the newest toast', async () => {
		const screen = await renderViewport([{ options: INFO_A, triggerLabel: 'Trigger A' }]);
		const trigger = screen.getByText('Trigger A', { exact: true }).element() as HTMLElement;
		trigger.focus();
		trigger.click();
		await tick();

		// Scoped to the render container: the toast text is also mirrored into the
		// singleton live region, which lives on <body>, outside it.
		await expect.element(screen.locator.getByText('Toast A', { exact: true })).toBeInTheDocument();
		expect(document.activeElement).toBe(trigger);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', bubbles: true }));
		await tick();

		// Focus lands on the dismiss button of the newest toast.
		const dismiss = screen
			.getByRole('button', { name: 'Dismiss notification', exact: true })
			.element() as HTMLElement;
		expect(document.activeElement).toBe(dismiss);
	});

	it('dismissing a focused toast moves focus to a remaining toast, not body', async () => {
		const screen = await renderViewport([
			{ options: INFO_A, triggerLabel: 'Trigger A' },
			{ options: INFO_B, triggerLabel: 'Trigger B' }
		]);
		(screen.getByText('Trigger A', { exact: true }).element() as HTMLElement).click();
		await tick();
		(screen.getByText('Trigger B', { exact: true }).element() as HTMLElement).click();
		await tick();

		expect(dismissButtons()).toHaveLength(2);

		// Focus the first toast's dismiss button, then dismiss it.
		const firstToast = document.querySelectorAll('[data-toast-id]')[0];
		const firstToastId = firstToast.getAttribute('data-toast-id') as string;
		const firstDismiss = firstToast.querySelector<HTMLElement>(
			'button[aria-label="Dismiss notification"]'
		) as HTMLElement;
		firstDismiss.focus();
		expect(document.activeElement).toBe(firstDismiss);

		firstDismiss.click();
		await tick();
		completeExit(firstToastId);
		await tick();

		// Focus must NOT drop to <body>; it moves to the remaining toast.
		expect(document.activeElement).not.toBe(document.body);
		expect(document.activeElement?.getAttribute('aria-label')).toBe('Dismiss notification');
	});

	it('dismissing the last focused toast restores the previously-focused element', async () => {
		const screen = await renderViewport([{ options: INFO_A, triggerLabel: 'Trigger A' }]);
		const trigger = screen.getByText('Trigger A', { exact: true }).element() as HTMLElement;
		trigger.focus();
		trigger.click();
		await tick();

		// F6 into the toast, remembering the trigger as the prior focus.
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', bubbles: true }));
		await tick();
		const dismiss = screen
			.getByRole('button', { name: 'Dismiss notification', exact: true })
			.element() as HTMLElement;
		expect(document.activeElement).toBe(dismiss);

		const toastId = toastIds()[0];

		dismiss.click();
		await tick();
		completeExit(toastId);
		await tick();

		// No toasts left — focus returns to the element focused before F6.
		expect(document.activeElement).toBe(trigger);
	});
});

describe('Toast blur timer pause', () => {
	// RESTATED. Upstream's middle assertion — "still present" after 5000ms of a
	// 3000ms timer — does not discriminate: a dismissed toast stays mounted for
	// its exit transition, so `getByText('Auto toast')` still finds it whether the
	// timer paused or fired. Deleting the `window.addEventListener('blur', …)`
	// registration from Toast leaves this case entirely green. Upstream's
	// assertion is kept verbatim and an `onHide` spy added beside it, which is the
	// observable that actually distinguishes "paused" from "fired and exiting".
	// `onHide` is an ordinary `ToastOptions` field already used by cases 6 and 7,
	// so nothing is invented; it is the same question the title asks.
	it('pauses the auto-hide timer while the window is blurred', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const onHide = vi.fn();
			const screen = await renderViewport([
				{ options: { ...AUTO_TOAST, onHide }, triggerLabel: 'Trigger Auto' }
			]);
			(screen.getByText('Trigger Auto', { exact: true }).element() as HTMLElement).click();
			await tick();
			expect(screen.container.textContent).toContain('Auto toast');

			// Window loses focus — timer should pause.
			window.dispatchEvent(new Event('blur'));
			vi.advanceTimersByTime(5000);
			await tick();
			// Still present because the timer was paused while blurred.
			expect(screen.container.textContent).toContain('Auto toast');
			expect(onHide).not.toHaveBeenCalled();

			// Window regains focus — timer resumes and the toast dismisses.
			window.dispatchEvent(new Event('focus'));
			vi.advanceTimersByTime(5000);
			await tick();
			const toastId = toastIds()[0];
			if (toastId) {
				completeExit(toastId);
				await tick();
			}
			expect(screen.container.textContent).not.toContain('Auto toast');
			expect(onHide).toHaveBeenCalledExactlyOnceWith('auto');
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('ToastViewport region ARIA', () => {
	// Upstream 0.5.1 gated the landmark on there being something to announce, and
	// split this into two cases: an empty viewport exposes no region at all, and the
	// region that appears with a toast still must not declare aria-modal.
	it('does not expose an empty notifications landmark', async () => {
		const screen = await renderViewport([{ options: INFO_A, triggerLabel: 'Trigger A' }]);
		expect(screen.getByRole('region', { name: 'Notifications', exact: true }).query()).toBeNull();
	});

	it('exposes the notifications region without a prohibited aria-modal when a toast is visible', async () => {
		const screen = await renderViewport([{ options: INFO_A, triggerLabel: 'Trigger A' }]);
		const trigger = screen.getByText('Trigger A', { exact: true }).element() as HTMLElement;
		trigger.click();
		await tick();

		const region = screen.getByRole('region', { name: 'Notifications', exact: true });
		// aria-modal is only valid on role="dialog"/"alertdialog"; a region must
		// not declare it (axe: aria-allowed-attr).
		await expect.element(region).not.toHaveAttribute('aria-modal');
	});
});

describe('toast announcements via singleton live regions', () => {
	const ERROR_TOAST: ToastOptions = { body: 'Upload failed', type: 'error' };
	const SAVING_V1: ToastOptions = { uniqueID: 'save', body: 'Saving changes' };
	const SAVING_V2: ToastOptions = { uniqueID: 'save', body: 'Changes saved' };
	const IGNORE_KEPT: ToastOptions = {
		uniqueID: 'dup',
		collisionBehavior: 'ignore',
		body: 'Kept'
	};
	const IGNORE_DROPPED: ToastOptions = {
		uniqueID: 'dup',
		collisionBehavior: 'ignore',
		body: 'Dropped'
	};

	let recorder: { calls: AnnounceRecord[]; stop: () => void } | null = null;
	afterEach(() => {
		recorder?.stop();
		recorder = null;
	});

	it('announces an info toast politely with its text content', async () => {
		// RESTATED IN INPUT. Upstream's body is a React fragment
		// (`<strong>Update ready</strong><div>Restart to apply</div>`) flattened to
		// "Update ready Restart to apply" by its `getNodeText`. `ToastContent` is
		// `string | Snippet` here and a `Snippet` is opaque — there is no children
		// tree to walk — so the announced value is the string body. See
		// `toastText` in `toast-viewport.svelte` for why a snippet body falls back
		// to the toast's own (born-with-content) region instead.
		recorder = recordAnnouncements();
		const screen = await renderViewport([{ options: INFO_A, triggerLabel: 'Show' }]);
		(screen.getByText('Show', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();

		// Announced at dispatch, exactly once, into the polite region.
		expect(recorder.calls).toEqual([['Toast A', 'polite']]);
		expect(regionText('polite')).toBe('Toast A');
		// Status toasts never touch the assertive region.
		expect(regionText('assertive')).toBe('');
	});

	it('announces an error toast assertively', async () => {
		recorder = recordAnnouncements();
		const screen = await renderViewport([{ options: ERROR_TOAST, triggerLabel: 'Show' }]);
		(screen.getByText('Show', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();

		expect(recorder.calls).toEqual([['Upload failed', 'assertive']]);
		expect(regionText('assertive')).toBe('Upload failed');
		expect(regionText('polite')).toBe('');
	});

	it('announces exactly once at dispatch, even when dispatched from an effect', async () => {
		// RESTATED. Upstream renders under `React.StrictMode`, whose double render
		// and double-invoked state updater are what its announcement must survive;
		// Svelte has neither, so the case would assert nothing. The Svelte-shaped
		// version of the same hazard is the consumer pattern `addToast`'s own
		// comment documents: dispatching from a `$effect`. If the announcement (or
		// the read around it) subscribed that effect to the viewport's toast list,
		// the effect's own write would re-run it and announce again — which is
		// exactly what `untrack` inside `addToast` prevents. Same question, same
		// observable: one dispatch, one announcement.
		recorder = recordAnnouncements();
		await render(EffectDispatch, { props: { options: INFO_A } });
		await settleAnnouncements();

		expect(recorder.calls).toEqual([['Toast A', 'polite']]);
	});

	it('re-announces a uniqueID toast when its content is overwritten', async () => {
		recorder = recordAnnouncements();
		const screen = await renderViewport([
			{ options: SAVING_V1, triggerLabel: 'Show v1' },
			{ options: SAVING_V2, triggerLabel: 'Show v2' }
		]);
		(screen.getByText('Show v1', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();
		expect(recorder.calls).toEqual([['Saving changes', 'polite']]);

		// Overwriting via uniqueID replaces the toast in place — the new content is
		// a fresh dispatch and must be announced again.
		(screen.getByText('Show v2', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();
		expect(recorder.calls).toEqual([
			['Saving changes', 'polite'],
			['Changes saved', 'polite']
		]);
		expect(regionText('polite')).toBe('Changes saved');

		// Still a single toast on screen — overwritten in place, not stacked.
		expect(screen.container.querySelectorAll('[data-toast-id]')).toHaveLength(1);
	});

	it('does not re-announce an unchanged toast when an unrelated render occurs', async () => {
		recorder = recordAnnouncements();
		const screen = await renderViewport([
			{ options: INFO_A, triggerLabel: 'Show A' },
			{ options: ERROR_TOAST, triggerLabel: 'Show B' }
		]);
		(screen.getByText('Show A', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();
		expect(recorder.calls).toHaveLength(1);

		// A second toast arriving re-renders the viewport with a new toast list.
		// Toast A is not re-dispatched, so it must not be announced again — only
		// the newly dispatched toast produces a call.
		(screen.getByText('Show B', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();
		expect(recorder.calls).toEqual([
			['Toast A', 'polite'],
			['Upload failed', 'assertive']
		]);
	});

	it('does not announce a toast whose uniqueID collision is ignored', async () => {
		recorder = recordAnnouncements();
		const screen = await renderViewport([
			{ options: IGNORE_KEPT, triggerLabel: 'Show 1' },
			{ options: IGNORE_DROPPED, triggerLabel: 'Show 2' }
		]);
		(screen.getByText('Show 1', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();
		expect(recorder.calls).toEqual([['Kept', 'polite']]);

		// The colliding toast is suppressed (collisionBehavior: 'ignore'), so it is
		// neither shown nor announced.
		(screen.getByText('Show 2', { exact: true }).element() as HTMLElement).click();
		await settleAnnouncements();
		expect(recorder.calls).toEqual([['Kept', 'polite']]);
		expect(screen.container.textContent).toContain('Kept');
		expect(screen.container.textContent).not.toContain('Dropped');
	});
});

describe('toast timer lifecycle (#3589)', () => {
	it('fires onHide exactly once when dismissed twice during the exit window', async () => {
		const onHide = vi.fn();
		const screen = await renderViewport([
			{ options: { body: 'Once', onHide }, triggerLabel: 'Show' }
		]);
		(screen.getByText('Show', { exact: true }).element() as HTMLElement).click();
		await tick();
		const dismiss = screen
			.getByRole('button', { name: 'Dismiss notification', exact: true })
			.element() as HTMLElement;
		dismiss.click();
		// The toast stays mounted during its exit transition; a second click
		// lands on the same still-mounted button.
		dismiss.click();
		await tick();
		expect(onHide).toHaveBeenCalledTimes(1);
	});

	it('keeps a window-blur pause alive when another toast arrives', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const onHide = vi.fn();
			const screen = await renderViewport([
				{ options: { body: 'Paused', autoHideDuration: 3000, onHide }, triggerLabel: 'Show A' },
				{ options: INFO_B, triggerLabel: 'Show B' }
			]);
			(screen.getByText('Show A', { exact: true }).element() as HTMLElement).click();
			await tick();
			window.dispatchEvent(new Event('blur'));
			// A second toast arriving re-renders the viewport; the paused timer
			// must not silently restart.
			(screen.getByText('Show B', { exact: true }).element() as HTMLElement).click();
			await tick();
			vi.advanceTimersByTime(60_000);
			await tick();
			expect(onHide).not.toHaveBeenCalled();
			// Focus returns: the remaining time resumes and completes normally.
			window.dispatchEvent(new Event('focus'));
			vi.advanceTimersByTime(60_000);
			await tick();
			expect(onHide).toHaveBeenCalledTimes(1);
			expect(onHide).toHaveBeenCalledWith('auto');
		} finally {
			vi.useRealTimers();
		}
	});
});
