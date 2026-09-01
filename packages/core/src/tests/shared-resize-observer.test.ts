/** PORTS: utils/sharedResizeObserver.test.ts */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Astryx's `src/utils/sharedResizeObserver.test.ts`, ported case for case — **6
 * upstream `it` declarations at the 0.5.0 pin, 6 here**, in upstream's order and under
 * upstream's titles. Nothing dropped, nothing added.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: the module is pure
 * DOM plumbing with no React and no rendering in it, and every case drives it
 * through a stubbed `ResizeObserver`, so it never boots Chromium.
 *
 * ## Three translations, none of them a dropped case
 *
 * **Where the module lives.** Upstream's is `src/utils/sharedResizeObserver.ts`;
 * this port placed it at `src/lib/internal/shared-resize-observer.ts` alongside
 * `naming.ts` and `sx.ts`. That is a recorded, deliberate divergence (see
 * port/todo.md, "Consolidate two homes for one upstream dir"), so the only thing
 * that changes is the import specifier — which stays a *dynamic* import, because
 * the module's singleton is module-level state and each case needs it fresh
 * after `vi.resetModules()`, exactly as upstream's does.
 *
 * **`document.createElement('div')` → a stand-in object.** This project's server
 * environment is node, which has no `document`. The module only ever uses the
 * element as a `Map` key and hands it to `observe`/`unobserve` on the stubbed
 * observer, so a unique plain object stands in for a `<div>` with no loss: the
 * dispatch cases still turn on reference identity, and `toHaveBeenCalledWith`
 * still distinguishes the two elements because each carries its own id.
 *
 * **`global` → `globalThis`.** The same object, spelled the way the rest of this
 * package's node suites spell it.
 */
describe('sharedResizeObserver', () => {
	let mockObserve: ReturnType<typeof vi.fn>;
	let mockUnobserve: ReturnType<typeof vi.fn>;
	let mockDisconnect: ReturnType<typeof vi.fn>;
	let capturedCallback: ResizeObserverCallback;
	let constructorCalls: number;
	let elementCount = 0;

	/** Stands in for upstream's `document.createElement('div')` — see the header. */
	function createElement(): Element {
		return { nodeName: 'DIV', id: `el-${++elementCount}` } as unknown as Element;
	}

	beforeEach(() => {
		mockObserve = vi.fn();
		mockUnobserve = vi.fn();
		mockDisconnect = vi.fn();
		constructorCalls = 0;

		globalThis.ResizeObserver = vi.fn(function (cb: ResizeObserverCallback) {
			constructorCalls++;
			capturedCallback = cb;
			return {
				observe: mockObserve,
				unobserve: mockUnobserve,
				disconnect: mockDisconnect
			};
		}) as unknown as typeof ResizeObserver;
	});

	afterEach(() => {
		vi.resetModules();
	});

	it('creates a single ResizeObserver for multiple elements', async () => {
		const { observeResize, unobserveResize } =
			await import('$lib/internal/shared-resize-observer.js');

		const el1 = createElement();
		const el2 = createElement();

		observeResize(el1, vi.fn());
		observeResize(el2, vi.fn());

		expect(constructorCalls).toBe(1);
		expect(mockObserve).toHaveBeenCalledTimes(2);
		expect(mockObserve).toHaveBeenCalledWith(el1);
		expect(mockObserve).toHaveBeenCalledWith(el2);

		unobserveResize(el1);
		unobserveResize(el2);
	});

	it('fires callback synchronously on registration', async () => {
		const { observeResize, unobserveResize } =
			await import('$lib/internal/shared-resize-observer.js');

		const el = createElement();
		const cb = vi.fn();

		observeResize(el, cb);

		// Callback should have fired once immediately with a synthetic entry
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith(expect.objectContaining({ target: el }));

		unobserveResize(el);
	});

	it('dispatches resize entries to the correct callbacks', async () => {
		const { observeResize, unobserveResize } =
			await import('$lib/internal/shared-resize-observer.js');

		const el1 = createElement();
		const el2 = createElement();
		const cb1 = vi.fn();
		const cb2 = vi.fn();

		observeResize(el1, cb1);
		observeResize(el2, cb2);

		// Reset counts from the initial synchronous fire
		cb1.mockClear();
		cb2.mockClear();

		// Simulate observer firing for el1 only
		capturedCallback([{ target: el1 } as unknown as ResizeObserverEntry], {} as ResizeObserver);

		expect(cb1).toHaveBeenCalledTimes(1);
		expect(cb2).not.toHaveBeenCalled();

		// Simulate observer firing for el2
		capturedCallback([{ target: el2 } as unknown as ResizeObserverEntry], {} as ResizeObserver);

		expect(cb2).toHaveBeenCalledTimes(1);

		unobserveResize(el1);
		unobserveResize(el2);
	});

	it('destroys the observer when the last element is unobserved', async () => {
		const { observeResize, unobserveResize } =
			await import('$lib/internal/shared-resize-observer.js');

		const el1 = createElement();
		const el2 = createElement();

		observeResize(el1, vi.fn());
		observeResize(el2, vi.fn());

		unobserveResize(el1);
		expect(mockDisconnect).not.toHaveBeenCalled();

		unobserveResize(el2);
		expect(mockDisconnect).toHaveBeenCalledTimes(1);
	});

	it('recreates observer after full teardown', async () => {
		const { observeResize, unobserveResize } =
			await import('$lib/internal/shared-resize-observer.js');

		const el1 = createElement();
		observeResize(el1, vi.fn());
		unobserveResize(el1);
		expect(constructorCalls).toBe(1);

		const el2 = createElement();
		observeResize(el2, vi.fn());
		expect(constructorCalls).toBe(2);

		unobserveResize(el2);
	});

	it('replaces callback when same element is observed twice', async () => {
		const { observeResize, unobserveResize } =
			await import('$lib/internal/shared-resize-observer.js');

		const el = createElement();
		const cb1 = vi.fn();
		const cb2 = vi.fn();

		observeResize(el, cb1);
		cb1.mockClear();

		observeResize(el, cb2);

		capturedCallback([{ target: el } as unknown as ResizeObserverEntry], {} as ResizeObserver);

		// Only the latest callback fires for subsequent resizes
		expect(cb1).not.toHaveBeenCalled();
		// cb2: initial fire (1) + observer fire (1) = but we only check the observer fire
		// cb2 was called once on registration, then once from capturedCallback
		expect(cb2).toHaveBeenCalledTimes(2);

		unobserveResize(el);
	});
});
