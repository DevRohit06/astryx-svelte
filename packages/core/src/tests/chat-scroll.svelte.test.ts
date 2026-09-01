/**
 * PORTS: Chat/useChatStreamScroll.test.tsx
 * PORTS: Chat/useChatNewMessages.test.tsx
 * PORTS: Chat/ChatLayout.test.tsx
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ChatLayoutProbe from './fixtures/chat-layout-probe.svelte';
import ChatNewMessagesProbe from './fixtures/chat-new-messages-probe.svelte';
import ChatStreamScrollProbe from './fixtures/chat-stream-scroll-probe.svelte';

/**
 * `useChatStreamScroll.test.tsx` (**9** at v0.3.0), `useChatNewMessages.test.tsx`
 * (4) and the first-fill half of `ChatLayout.test.tsx` (2) — **15 cases**,
 * ported case for case.
 *
 * (The previous header said "`useChatStreamScroll.test.tsx` (7) … 13 cases".
 * That suite has three describes, not two: the `prefers-reduced-motion` pair was
 * unported and unnamed. Both are ported here — `use-chat-stream-scroll.svelte.ts`
 * already reads `(prefers-reduced-motion: reduce)` through `useMediaQuery` — and
 * both passed on the first run.)
 *
 * They share a file because they share the same two stubs. Upstream's rationale
 * carries over unchanged: these cover only the *synchronous* scroll paths,
 * because the spring's frame-by-frame integration is layout-dependent and
 * mocking it would only test the mock.
 *
 * **Two translations, both forced by running in a real browser rather than
 * jsdom.** Upstream defines `scrollHeight`/`clientHeight` onto the element,
 * which jsdom accepts as gospel; Chromium clamps a `scrollTop` write on an
 * element that does not really overflow, so the fixtures give the content real
 * height instead and the assertions read `scrollHeight - clientHeight` where
 * upstream writes the arithmetic out. And `act()` becomes `flushSync`, which is
 * what makes a `$state` write land in the DOM before the next assertion.
 *
 * `activeObservations` needs the fake `ResizeObserver` for one reason only: the
 * detach case asks how many elements are still observed, which the real one does
 * not expose. Note our `observeResize` fires its own synthetic initial callback,
 * so with the fake (which also fires on `observe`) a consumer sees two initial
 * calls; every upstream case here asserts *that* it fired, not how often.
 */

type ObserverEntry = { element: Element; callback: ResizeObserverCallback };
let activeObservations: ObserverEntry[] = [];

class FakeResizeObserver {
	callback: ResizeObserverCallback;
	observed = new Set<Element>();

	constructor(cb: ResizeObserverCallback) {
		this.callback = cb;
	}

	observe(el: Element) {
		this.observed.add(el);
		activeObservations.push({ element: el, callback: this.callback });
		this.callback([{ target: el } as ResizeObserverEntry], this as unknown as ResizeObserver);
	}

	unobserve(el: Element) {
		this.observed.delete(el);
		activeObservations = activeObservations.filter((o) => o.element !== el);
	}

	disconnect() {
		for (const el of this.observed) {
			activeObservations = activeObservations.filter((o) => o.element !== el);
		}
		this.observed.clear();
	}
}

let rafQueue: FrameRequestCallback[] = [];

function flushRaf() {
	// One flush = one frame: callbacks scheduled during a flush run next flush.
	const frame = rafQueue;
	rafQueue = [];
	for (const cb of frame) {
		cb(performance.now());
	}
}

function stubRaf() {
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		rafQueue.push(cb);
		return rafQueue.length;
	});
	vi.stubGlobal('cancelAnimationFrame', () => {});
}

/** Where "scrolled to the bottom" is, for whatever the element currently holds. */
const bottomOf = (el: HTMLElement) => el.scrollHeight - el.clientHeight;

describe('useChatStreamScroll — initial positioning', () => {
	beforeEach(() => {
		rafQueue = [];
		stubRaf();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	async function renderHook(options?: Record<string, unknown>) {
		const screen = await render(ChatStreamScrollProbe, { props: { options } });
		const el = screen.container.querySelector('[data-testid="scroller"]') as HTMLElement;
		const setContentHeight = (px: number) => flushSync(() => screen.component.setContentHeight(px));
		return { api: screen.component.api, el, setContentHeight };
	}

	it('default: jumps to the bottom on mount when content is scrollable', async () => {
		const { el, setContentHeight } = await renderHook();
		setContentHeight(1000);
		flushRaf();
		expect(el.scrollTop).toBe(600);
	});

	it('positions the first async fill in one synchronous step', async () => {
		const { api, el, setContentHeight } = await renderHook();
		// Mount while loading — nothing scrollable yet.
		setContentHeight(400);
		flushRaf();
		expect(el.scrollTop).toBe(0);

		// Async content lands; the layout's ResizeObserver calls scrollIfLocked.
		setContentHeight(1200);
		api.scrollIfLocked();
		// Positioned synchronously — no animation frames needed.
		expect(el.scrollTop).toBe(800);

		// Subsequent growth (streaming) goes back to the spring: nothing moves
		// until animation frames run.
		setContentHeight(1600);
		api.scrollIfLocked();
		expect(el.scrollTop).toBe(800);
	});

	it('consumes the pending first fill via the mount jump too', async () => {
		const { api, el, setContentHeight } = await renderHook();
		// Content already present at mount.
		setContentHeight(1000);
		flushRaf();
		expect(el.scrollTop).toBe(600);

		// Growth after the mount jump is streaming — spring path, not instant.
		setContentHeight(1400);
		api.scrollIfLocked();
		expect(el.scrollTop).toBe(600);
	});

	it('default: starts locked', async () => {
		const { api } = await renderHook();
		expect(api.isLocked).toBe(true);
	});
});

describe("useChatStreamScroll — scrollToBottom({behavior: 'instant'})", () => {
	beforeEach(() => {
		rafQueue = [];
		stubRaf();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	async function renderHook() {
		const screen = await render(ChatStreamScrollProbe, {});
		const el = screen.container.querySelector('[data-testid="scroller"]') as HTMLElement;
		const setContentHeight = (px: number) => flushSync(() => screen.component.setContentHeight(px));
		return { api: screen.component.api, el, setContentHeight };
	}

	it('jumps synchronously without scheduling animation frames', async () => {
		const { api, el, setContentHeight } = await renderHook();
		setContentHeight(1000);
		flushRaf(); // consume the mount jump
		el.scrollTop = 100; // user scrolled up

		rafQueue = [];
		api.scrollToBottom({ behavior: 'instant' });
		expect(el.scrollTop).toBe(600);
		expect(rafQueue).toHaveLength(0);
	});

	it('re-locks after an instant jump', async () => {
		const { api, el, setContentHeight } = await renderHook();
		setContentHeight(1000);
		flushRaf();
		api.unlock();
		expect(api.isLocked).toBe(false);

		api.scrollToBottom({ behavior: 'instant' });
		expect(api.isLocked).toBe(true);
		expect(el.scrollTop).toBe(600);
	});

	it('default scrollToBottom animates instead of jumping', async () => {
		const { api, el, setContentHeight } = await renderHook();
		setContentHeight(1000);
		flushRaf();
		el.scrollTop = 100;

		api.scrollToBottom();
		// Spring path: position is untouched until animation frames run.
		expect(el.scrollTop).toBe(100);
		expect(rafQueue.length).toBeGreaterThan(0);
	});
});

describe('useChatStreamScroll — prefers-reduced-motion', () => {
	beforeEach(() => {
		rafQueue = [];
		stubRaf();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	/**
	 * Upstream's `stubReducedMotion`, verbatim in substance: every query answers
	 * `matches` for `prefers-reduced-motion`. It must be installed before the
	 * probe renders, because `useMediaQuery` subscribes during init.
	 */
	function stubReducedMotion(): void {
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: query.includes('prefers-reduced-motion'),
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		}));
	}

	async function renderHook() {
		const screen = await render(ChatStreamScrollProbe, {});
		const el = screen.container.querySelector('[data-testid="scroller"]') as HTMLElement;
		const setContentHeight = (px: number) => flushSync(() => screen.component.setContentHeight(px));
		return { api: screen.component.api, el, setContentHeight };
	}

	it('streaming growth jumps synchronously instead of springing', async () => {
		stubReducedMotion();
		stubRaf();
		const { api, el, setContentHeight } = await renderHook();
		setContentHeight(1000);
		flushRaf(); // consume the mount jump
		expect(el.scrollTop).toBe(600);

		// Post-first-fill growth would normally take the spring path; under
		// reduced motion it must land in the same synchronous step.
		setContentHeight(1400);
		rafQueue = [];
		api.scrollIfLocked();
		expect(el.scrollTop).toBe(1000);
		expect(rafQueue).toHaveLength(0);
	});

	it('default scrollToBottom falls back to an instant jump', async () => {
		stubReducedMotion();
		stubRaf();
		const { api, el, setContentHeight } = await renderHook();
		setContentHeight(1000);
		flushRaf();
		el.scrollTop = 100; // user scrolled up

		rafQueue = [];
		api.scrollToBottom();
		expect(el.scrollTop).toBe(600);
		expect(rafQueue).toHaveLength(0);
		expect(api.isLocked).toBe(true);
	});
});

describe('useChatNewMessages — content callback (issue #2282)', () => {
	beforeEach(() => {
		activeObservations = [];
		vi.stubGlobal('ResizeObserver', FakeResizeObserver);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('attaches observer when element is provided immediately', async () => {
		const onResize = vi.fn();
		await render(ChatNewMessagesProbe, { props: { onResize } });
		// observeResize fires initial callback → onResize called
		expect(onResize).toHaveBeenCalled();
	});

	it('attaches observer when element mounts late (callback ref)', async () => {
		const onResize = vi.fn();
		const screen = await render(ChatNewMessagesProbe, {
			props: { onResize, initiallyMounted: false }
		});

		// Before mount — no element, no observer
		expect(onResize).not.toHaveBeenCalled();

		// Mount the content element
		flushSync(() => screen.component.toggle());

		// The attachment fires → observer attaches → initial callback → onResize
		expect(onResize).toHaveBeenCalled();
	});

	it('detaches observer when element unmounts', async () => {
		const onResize = vi.fn();
		const screen = await render(ChatNewMessagesProbe, { props: { onResize } });
		expect(onResize).toHaveBeenCalled();

		const observationsBefore = activeObservations.length;

		flushSync(() => screen.component.toggle());

		// Observer should have been detached
		expect(activeObservations.length).toBeLessThan(observationsBefore);
	});

	it('works end-to-end with ChatLayout conditional ChatMessageList', async () => {
		const screen = await render(ChatLayoutProbe, {
			props: { initialMessages: 0, emptyStateText: 'Empty state' }
		});

		// Empty state showing — no content observer yet
		await expect.element(screen.getByText('Empty state', { exact: true })).toBeInTheDocument();

		// Add first message — ChatMessageList mounts
		await userEvent.click(screen.getByTestId('add-message'));

		await expect.element(screen.getByText('msg-0', { exact: true })).toBeInTheDocument();

		// The inner content div should now be observed
		const contentObservation = activeObservations.find((o) => {
			const el = o.element;
			if (!el.querySelector?.('.astryx-chat-message')) {
				return false;
			}
			if (el.className?.includes('astryx-chat-layout')) {
				return false;
			}
			return true;
		});

		expect(contentObservation).toBeDefined();
	});
});

describe('ChatLayout — first-fill scroll positioning', () => {
	beforeEach(() => {
		activeObservations = [];
		rafQueue = [];
		vi.stubGlobal('ResizeObserver', FakeResizeObserver);
		stubRaf();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function fireContentResize() {
		for (const { element, callback } of [...activeObservations]) {
			callback([{ target: element } as ResizeObserverEntry], null as unknown as ResizeObserver);
		}
	}

	async function renderLayout() {
		const screen = await render(ChatLayoutProbe, {
			props: { initialMessages: 1, contentHeight: 0, externalScroller: true }
		});
		const root = screen.container.querySelector('[data-testid="scroller"]') as HTMLElement;
		const setContentHeight = (px: number) => flushSync(() => screen.component.setContentHeight(px));
		return { root, setContentHeight };
	}

	it('positions async-loaded content synchronously on the first fill', async () => {
		const { root, setContentHeight } = await renderLayout();
		// Mounted while content is short (loading) — not scrollable.
		flushRaf();
		expect(root.scrollTop).toBe(0);

		// Content lands: the message list's ResizeObserver fires.
		setContentHeight(1400);
		fireContentResize();
		// Positioned in the same synchronous step — no animation frames.
		expect(root.scrollTop).toBe(bottomOf(root));
		expect(root.scrollTop).toBeGreaterThan(0);
	});

	it('springs on growth after the first fill — animation owns it', async () => {
		const { root, setContentHeight } = await renderLayout();
		flushRaf();

		// First fill: instant.
		setContentHeight(1400);
		fireContentResize();
		const settled = root.scrollTop;
		expect(settled).toBe(bottomOf(root));
		// `bottomOf` is read off the live element, so it degenerates to `0 === 0` if
		// the fixture ever stops overflowing — the original `expected +0 to be 600`
		// failure. The sibling case above carries the same guard.
		expect(settled).toBeGreaterThan(0);

		// Streaming growth: nothing moves until animation frames run.
		rafQueue.length = 0;
		setContentHeight(1800);
		fireContentResize();
		expect(root.scrollTop).toBe(settled);
		expect(rafQueue.length).toBeGreaterThan(0);
	});
});
