import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/streaming-text-probe.svelte';

/**
 * Ported from Astryx's `hooks/useStreamingText.test.ts` at **v0.4.1** — its
 * `useStreamingText` describe, **all eleven cases**, in upstream's order and
 * with its assertions unchanged. Nothing is dropped. The file's *second*
 * describe, `snapToGraphemeBoundary`, is a pure function of a string and an
 * offset and lives in the node project as `use-streaming-text.test.ts`; between
 * the two files upstream's 14 cases are all present.
 *
 * Runs in the **client** (real Chromium) project, and it has to: the hook is
 * `$effect.pre` (the reset/snap comparisons upstream does during render) plus
 * one `$effect` (the rAF loop), and neither runs under `svelte/server`. A node
 * run could only ever reach the two short-circuit returns; there would be no
 * animation frame to drive, so nine of the eleven cases would assert nothing
 * real.
 *
 * Both of upstream's stubs are kept verbatim, and they matter *more* here than
 * upstream rather than less:
 *
 * - **rAF** — a real browser really does paint. Handing the hook a queue the
 *   test drains by hand is what makes "reveal `charsPerTick` per `tickMs`"
 *   checkable at all; against real frames every one of these assertions becomes
 *   a race with the compositor. Overriding the global is enough because Svelte
 *   schedules its own work on microtasks, not frames, so mount and flush are
 *   untouched.
 * - **matchMedia** — Chromium answers `(prefers-reduced-motion: reduce)` from
 *   the *machine*. Without the stub, cases 3 and 4 would pass or fail depending
 *   on the runner's OS accessibility settings, and the other eight would flip
 *   behaviour on a developer who has reduced motion on. Only the reduced-motion
 *   query reflects `prefersReducedMotion`; the theme queries `useTheme` →
 *   `useThemeMode` → `useMediaQuery` issues always report no match, as upstream.
 *   It is restored in `afterEach` so the real one is back for the next file.
 *
 * `renderHook`'s `result.current` becomes the probe's instance export, whose
 * `.current` is the hook's own live getter — upstream reads it synchronously
 * right after each `act()`, and a `$state` read here is likewise up to date the
 * moment the rAF callback returns. `act()` itself has no counterpart, and
 * `rerender` is a props write.
 */

describe('useStreamingText', () => {
	let rafCallbacks: ((time: number) => void)[];
	let originalRAF: typeof requestAnimationFrame;
	let originalCAF: typeof cancelAnimationFrame;
	let originalMatchMedia: typeof window.matchMedia | undefined;
	// Toggled per-test to drive the reduced-motion media query. Reset in
	// beforeEach so the preference never leaks between tests.
	let prefersReducedMotion: boolean;

	beforeEach(() => {
		rafCallbacks = [];
		originalRAF = globalThis.requestAnimationFrame;
		originalCAF = globalThis.cancelAnimationFrame;
		globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
			rafCallbacks.push(cb);
			return rafCallbacks.length;
		});
		globalThis.cancelAnimationFrame = vi.fn();

		// Mock matchMedia for useTheme → useMediaQuery and the hook's own
		// reduced-motion read. Only the reduced-motion query reflects
		// `prefersReducedMotion`; theme media queries always report no match.
		prefersReducedMotion = false;
		originalMatchMedia = window.matchMedia;
		Object.defineProperty(window, 'matchMedia', {
			configurable: true,
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		});
	});

	afterEach(() => {
		globalThis.requestAnimationFrame = originalRAF;
		globalThis.cancelAnimationFrame = originalCAF;
		// Restore matchMedia so the mock never leaks into other suites. Chromium
		// always has one — upstream's `delete` branch is for jsdom, which does not
		// — so the assignment is the only reachable half here.
		if (originalMatchMedia !== undefined) {
			window.matchMedia = originalMatchMedia;
		}
	});

	it('returns full text when not streaming', async () => {
		const { component } = await render(Probe, {
			props: { text: 'Hello world', streaming: false }
		});
		expect(component.result.current).toBe('Hello world');
	});

	it('returns full text with instant speed', async () => {
		const { component } = await render(Probe, {
			props: { text: 'Hello world', streaming: true, speed: 'instant' }
		});
		expect(component.result.current).toBe('Hello world');
	});

	it('snaps to full text immediately when reduced motion is preferred', async () => {
		prefersReducedMotion = true;
		const { component } = await render(Probe, {
			props: { text: 'Hello world', streaming: true }
		});
		expect(component.result.current).toBe('Hello world');
	});

	it('keeps snapping to the full text on updates when reduced motion is preferred', async () => {
		prefersReducedMotion = true;
		const screen = await render(Probe, { props: { text: 'Hello', streaming: true } });

		expect(screen.component.result.current).toBe('Hello');

		// A later chunk arrives — it should appear in full, not reveal char-by-char.
		await screen.rerender({ text: 'Hello world', streaming: true });
		expect(screen.component.result.current).toBe('Hello world');
	});

	it('starts with empty string when streaming', async () => {
		const { component } = await render(Probe, {
			props: { text: 'Hello world', streaming: true }
		});
		expect(component.result.current).toBe('');
	});

	it('snaps to full text when streaming ends', async () => {
		const screen = await render(Probe, {
			props: { text: 'Hello world', streaming: true }
		});

		expect(screen.component.result.current).toBe('');

		// Stop streaming
		await screen.rerender({ text: 'Hello world', streaming: false });
		expect(screen.component.result.current).toBe('Hello world');
	});

	it('resets when target text clears', async () => {
		const screen = await render(Probe, { props: { text: 'Hello', streaming: false } });

		expect(screen.component.result.current).toBe('Hello');

		// Clear text (new message)
		await screen.rerender({ text: '', streaming: true });
		expect(screen.component.result.current).toBe('');
	});

	it('progressively reveals text through animation frames', async () => {
		const { component } = await render(Probe, {
			props: { text: 'Hello, world! This is a test.', streaming: true }
		});

		expect(component.result.current).toBe('');

		// Fire animation frames
		let lastLen = 0;
		for (let i = 0; i < 20; i++) {
			if (rafCallbacks.length > 0) {
				const cb = rafCallbacks.pop()!;
				cb(performance.now() + i * 20);
			}
			expect(component.result.current.length).toBeGreaterThanOrEqual(lastLen);
			lastLen = component.result.current.length;
		}

		expect(component.result.current.length).toBeGreaterThan(0);
	});

	it('advances monotonically without stalls or backwards jumps', async () => {
		const targetText = 'Hello **world**, this is `code` and [a link](http://example.com).';
		const { component } = await render(Probe, {
			props: { text: targetText, streaming: true }
		});

		expect(component.result.current).toBe('');

		// Fire many animation frames — the revealed length should only increase
		const lengths: number[] = [0];
		for (let i = 0; i < 50; i++) {
			if (rafCallbacks.length > 0) {
				const cb = rafCallbacks.pop()!;
				cb(performance.now() + i * 20);
			}
			const len = component.result.current.length;
			expect(len).toBeGreaterThanOrEqual(lengths[lengths.length - 1]);
			lengths.push(len);
		}

		// Should have made progress (not stuck at 0)
		expect(lengths[lengths.length - 1]).toBeGreaterThan(0);

		// Should never have gone backwards
		for (let i = 1; i < lengths.length; i++) {
			expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i - 1]);
		}
	});

	it('does not stall on markdown syntax characters', async () => {
		// Text with lots of markdown syntax that previously caused stalls
		const targetText = '- **bold** and *italic* with `code` and [link](url) and ~~strike~~';
		const { component } = await render(Probe, {
			props: { text: targetText, streaming: true }
		});

		// Fire enough frames to drain the entire text
		for (let i = 0; i < 100; i++) {
			if (rafCallbacks.length > 0) {
				const cb = rafCallbacks.pop()!;
				cb(performance.now() + i * 60);
			}
		}

		// With enough frames and time elapsed, should have revealed everything
		// (or close to it — the hook drains charsPerTick per tickMs)
		expect(component.result.current.length).toBeGreaterThan(targetText.length * 0.5);
	});

	it('never reveals a tick boundary landing mid-surrogate-pair or mid-ZWJ-emoji-sequence (#4779)', async () => {
		// natural speed advances 10 UTF-16 code units per tick. 9 ASCII chars
		// (indices 0-8) followed by a 4-person ZWJ family emoji (indices 9-19,
		// one grapheme cluster, 11 code units) means the first tick's raw
		// boundary (index 10) lands one code unit into the family emoji's first
		// surrogate pair -- exactly the failure case from the issue.
		const family = '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}';
		const targetText = 'a'.repeat(9) + family + 'end';
		const { component } = await render(Probe, {
			props: { text: targetText, streaming: true }
		});

		expect(rafCallbacks.length).toBeGreaterThan(0);
		const cb = rafCallbacks.pop()!;
		cb(performance.now() + 20);

		// Without the fix this would be 'a'.repeat(9) + a lone high surrogate
		// (renders as U+FFFD). With the fix, the whole not-yet-complete family
		// cluster is held back rather than rendering a broken glyph.
		expect(component.result.current).toBe('a'.repeat(9));
	});
});
