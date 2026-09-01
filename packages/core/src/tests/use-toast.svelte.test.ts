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

		// App mode is light, so the toast's inverted surface must be dark — if the
		// fallback fell back to OS preference (dark) instead, this would be 'light'
		// and the toast's text/icon would compute the same colour as its own
		// background (the invisible-toast bug).
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

		// mode="system" removes data-theme from <html>, so the attribute fallback
		// has nothing to read and OS preference (dark) resolves the mode — leaving
		// the inverted surface light.
		expect(newestMediaAttr(fallbackContainer()!)).toBe('light');
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
