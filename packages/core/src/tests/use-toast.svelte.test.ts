/** PORTS: Toast/useToast.test.tsx */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import Fixture from './fixtures/theme-show-toast.svelte';
import type { ToastOptions } from '$lib/components/toast/types.js';

/**
 * Ported from Astryx's `Toast/useToast.test.tsx`, all 4 cases at the 0.5.0 pin,
 * in order.
 *
 * The suite was **deferred at batch 7** because every case drives theme-mode
 * resolution through `<Theme>` + `defineTheme` + a `matchMedia` mock, and
 * `<Theme>` was unported. It landed in batch 8, so this is the restoration —
 * nothing is dropped.
 *
 * ## Project
 *
 * Client (real Chromium). The fallback viewport is mounted into `document.body`
 * with `mount()`, its container mirrors `<html>`'s attributes through a real
 * `MutationObserver`, and the exit path is a CSS transition — none of which jsdom
 * would exercise.
 *
 * ## The fallback viewport is a module singleton
 *
 * As upstream's is: whichever case runs first mounts it, and it persists for the
 * rest of the file, which is exactly the shape of a real app whose root
 * `<Theme>` changes mode over time. Each case therefore reads the *newest*
 * `[data-astryx-media]` node rather than assuming a count, and `afterEach`
 * dismisses whatever it added so no lingering toast stays subscribed to the
 * shared theme observer.
 *
 * ## Translations, none of them a case
 *
 * `act()` disappears — a `$state` write flushes on its own and `expect.poll`
 * retries until it has. `fireEvent.click` becomes a synchronous
 * `HTMLElement.click()`, as the sibling `ToastViewport` suite does, so focus
 * never moves. Upstream's `rerender(<Theme mode=…>)` becomes the render result's
 * `rerender({ mode })` on one fixture. And upstream's bare `window.matchMedia =`
 * assignment becomes `vi.stubGlobal`, restored in `afterEach`, because a real
 * browser page is shared with every other suite.
 *
 * ## `data-astryx-media` is measured, not derived, and the stub cannot reach it
 *
 * The two `theme mode` cases below predate `MediaTheme mode="auto"`. A toast used
 * to *guess* its media side from the resolved theme mode, so an assertion on
 * `[data-astryx-media]` was an assertion about that guess and a `matchMedia` stub
 * decided it. Upstream #5299 replaced the guess with a measurement of the painted
 * surface, and batch 042 adopted it — `toast-surface.svelte` now passes
 * `mode="auto" fallback={…}`.
 *
 * `vi.stubGlobal('matchMedia', …)` changes what *JavaScript* reads and nothing
 * about what Chromium paints: CSS `@media (prefers-color-scheme)` still answers
 * from the real browser, which is light. So a stubbed "OS prefers dark" now
 * disagrees with the surface, and the measurement wins — correctly, since the
 * measurement is what the user sees. That is the whole point of the change: the
 * old guess would have painted light text on a light-mode inverted surface.
 *
 * Each case says which value it expects and why. The measurement itself is
 * covered by `auto-media-mode.test.ts`; what stays this suite's subject is the
 * fallback viewport — that it exists, mirrors the root's theme attributes, and
 * dismisses cleanly.
 */

const testTheme = defineTheme({ name: 'test', tokens: {} });
const NO_AUTO_HIDE: ToastOptions = { body: 'hello', isAutoHide: false };

function mockMatchMedia(prefersDark: boolean): void {
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockImplementation((query: string) => ({
			matches: query.includes('dark') ? prefersDark : false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}))
	);
}

// The fallback's toasts accumulate in one persistent viewport across cases (see
// the file header) — take the most recently added one.
function newestMediaAttr(scope: ParentNode): string | null {
	const nodes = scope.querySelectorAll('[data-astryx-media]');
	const last = nodes[nodes.length - 1];
	return last ? last.getAttribute('data-astryx-media') : null;
}

function fallbackContainer(): HTMLElement | null {
	return document.querySelector<HTMLElement>('[data-astryx-toast-fallback]');
}

// Fire the transition-end `ToastViewport` listens for to unmount an exiting
// toast — the sibling suite's `completeExit`, which real CSS transitions would
// otherwise take their own time to deliver.
function completeExit(node: HTMLElement): void {
	node.dispatchEvent(
		new TransitionEvent('transitionend', {
			propertyName: 'grid-template-rows',
			bubbles: true,
			cancelable: true
		})
	);
}

/**
 * Dismisses every toast still mounted in the fallback viewport, so none stays
 * subscribed to the shared theme observer once this case's `<Theme>` unmounts.
 */
async function dismissAllFallbackToasts(): Promise<void> {
	const fallback = fallbackContainer();
	const nodes = Array.from(fallback?.querySelectorAll<HTMLElement>('[data-toast-id]') ?? []);

	for (const node of nodes) {
		node.querySelector<HTMLElement>('button[aria-label="Dismiss notification"]')?.click();
	}
	for (const node of nodes) {
		completeExit(node);
	}
	await expect.poll(() => fallbackContainer()?.querySelectorAll('[data-toast-id]').length).toBe(0);
}

describe('useToast fallback viewport theme mode', () => {
	afterEach(async () => {
		await dismissAllFallbackToasts();
		vi.unstubAllGlobals();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
	});

	it('resolves the app mode (light) instead of OS preference (dark) with no LayerProvider', async () => {
		mockMatchMedia(true); // OS prefers dark

		const screen = await render(Fixture, {
			props: { theme: testTheme, mode: 'light', options: NO_AUTO_HIDE }
		});
		(screen.getByText('Trigger', { exact: true }).element() as HTMLElement).click();

		await expect
			.poll(() => fallbackContainer()?.querySelector('[data-astryx-media]'))
			.not.toBeNull();

		// App mode is light, so the inverted surface paints dark and the
		// measurement reads it as dark. Under the pre-`auto` guess this assertion
		// tested that the fallback viewport resolved the *app* mode rather than the
		// OS preference; it now tests that the painted surface agrees, which is the
		// stronger of the two and the one the invisible-toast bug turns on.
		expect(newestMediaAttr(fallbackContainer()!)).toBe('dark');
	});

	it('keeps the OS-preference fallback for mode="system" with no LayerProvider', async () => {
		mockMatchMedia(true); // OS prefers dark

		// The fallback viewport is a persistent singleton (see the file header), so
		// count beforehand rather than assuming a prior count — this case has to
		// survive running alone as well as in sequence.
		const countBefore = fallbackContainer()?.querySelectorAll('[data-astryx-media]').length ?? 0;

		const screen = await render(Fixture, {
			props: {
				theme: testTheme,
				mode: 'system',
				options: NO_AUTO_HIDE,
				triggerLabel: 'Trigger System'
			}
		});
		(screen.getByText('Trigger System', { exact: true }).element() as HTMLElement).click();

		await expect
			.poll(() => fallbackContainer()?.querySelectorAll('[data-astryx-media]').length ?? 0)
			.toBeGreaterThan(countBefore);

		// `mode="system"` removes `data-theme` from `<html>`, so nothing pins the
		// theme and CSS falls to `prefers-color-scheme` — which, in this browser,
		// is *light*, whatever the `matchMedia` stub tells JavaScript. The surface
		// therefore paints light-mode inverted (dark) and the measurement reads
		// 'dark'.
		//
		// This case asserted 'light' before batch 042, derived from the stub. That
		// value was the guess, and the guess was wrong about the pixels: a toast
		// rendered with `mode="dark"` over a dark surface is the invisible-toast
		// bug in the other direction. See the header.
		expect(newestMediaAttr(fallbackContainer()!)).toBe('dark');
	});

	it('mirrors <html data-theme> and data-astryx-theme onto the fallback container', async () => {
		mockMatchMedia(false);

		const screen = await render(Fixture, {
			props: {
				theme: testTheme,
				mode: 'dark',
				options: NO_AUTO_HIDE,
				triggerLabel: 'Trigger Mirror'
			}
		});
		(screen.getByText('Trigger Mirror', { exact: true }).element() as HTMLElement).click();

		await expect.poll(() => fallbackContainer()?.getAttribute('data-theme')).toBe('dark');
		expect(fallbackContainer()!.getAttribute('data-astryx-theme')).toBe('test');
		// The inline color-scheme must follow the mirrored mode, not <html>'s own
		// theme CSS — see `syncRootThemeAttrs` in use-toast.svelte.ts.
		expect(fallbackContainer()!.style.colorScheme).toBe('dark');

		// Flip the app mode: the container's MutationObserver re-syncs, so the
		// inline colour-scheme must follow it live.
		await screen.rerender({ mode: 'light' });

		await expect.poll(() => fallbackContainer()?.getAttribute('data-theme')).toBe('light');
		expect(fallbackContainer()!.style.colorScheme).toBe('light');

		// mode="system" removes <html data-theme> entirely — the inline property
		// must go too, reverting to whatever the CSS otherwise resolves.
		await screen.rerender({ mode: 'system' });

		await expect.poll(() => fallbackContainer()?.getAttribute('data-theme')).toBeNull();
		expect(fallbackContainer()!.style.colorScheme).toBe('');
	});
});

describe('useToast LayerProvider path', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
	});

	it('resolves mode via real context, unaffected by the fallback provider', async () => {
		mockMatchMedia(true); // OS prefers dark; should be irrelevant here

		const screen = await render(Fixture, {
			props: {
				theme: testTheme,
				mode: 'light',
				options: NO_AUTO_HIDE,
				triggerLabel: 'Trigger Provider',
				hasViewport: true
			}
		});
		(screen.getByText('Trigger Provider', { exact: true }).element() as HTMLElement).click();

		await expect.poll(() => newestMediaAttr(screen.container)).toBe('dark');
	});
});
