import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/media-query-probe.svelte';

/**
 * Ported from Astryx's `hooks/useMediaQuery.test.ts`.
 *
 * Eight of upstream's ten cases live here; the two that call `renderToString`
 * are the SSR path and run in the node project instead — see
 * `media-query.test.ts` next door.
 *
 * The mock `MediaQueryList` is upstream's verbatim. What changes is how the
 * value is read: `renderHook`'s `result.current` becomes the probe's rendered
 * text, and `act()` disappears — a `$state` write flushes on its own, and
 * `expect.element` retries until it has, which is the same guarantee `act` was
 * providing.
 */

function createMockMatchMedia(matches: boolean) {
	const listeners: ((e: MediaQueryListEvent) => void)[] = [];
	return {
		matches,
		media: '',
		onchange: null,
		addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
			listeners.push(handler);
		}),
		removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
			const index = listeners.indexOf(handler);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}),
		dispatchEvent: vi.fn(),
		// Helper to simulate media query change
		_triggerChange(newMatches: boolean) {
			this.matches = newMatches;
			listeners.forEach((fn) => fn({ matches: newMatches } as MediaQueryListEvent));
		},
		_listeners: listeners
	};
}

describe('useMediaQuery', () => {
	let mockMql: ReturnType<typeof createMockMatchMedia>;

	beforeEach(() => {
		mockMql = createMockMatchMedia(false);
		vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMql));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns false when media query does not match', async () => {
		const screen = await render(Probe, { props: { query: '(max-width: 768px)' } });
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('false');
	});

	it('returns true when media query matches', async () => {
		mockMql = createMockMatchMedia(true);
		vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMql));

		const screen = await render(Probe, { props: { query: '(max-width: 768px)' } });
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('true');
	});

	it('updates when media query changes', async () => {
		const screen = await render(Probe, { props: { query: '(max-width: 768px)' } });
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('false');

		mockMql._triggerChange(true);
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('true');

		mockMql._triggerChange(false);
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('false');
	});

	it('passes the query string to matchMedia', async () => {
		await render(Probe, { props: { query: '(min-width: 1024px)' } });
		expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
	});

	it('cleans up event listener on unmount', async () => {
		const screen = await render(Probe, { props: { query: '(max-width: 768px)' } });
		expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

		await screen.unmount();
		expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
	});

	it('re-subscribes when query changes', async () => {
		const mockMql2 = createMockMatchMedia(true);
		const matchMediaFn = vi.fn().mockReturnValue(mockMql);
		vi.stubGlobal('matchMedia', matchMediaFn);

		const screen = await render(Probe, { props: { query: '(max-width: 768px)' } });
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('false');

		// Change query
		matchMediaFn.mockReturnValue(mockMql2);
		await screen.rerender({ query: '(max-width: 1024px)' });
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('true');
		expect(matchMediaFn).toHaveBeenCalledWith('(max-width: 1024px)');
	});

	it('returns serverDefault during SSR (no matchMedia)', async () => {
		// The real SSR path is covered in the node project. Here the contract is
		// that serverDefault is accepted and the live value wins on the client:
		// serverDefault=true but the browser says false → false.
		const screen = await render(Probe, {
			props: { query: '(max-width: 768px)', serverDefault: true }
		});
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('false');
	});

	it('uses serverDefault=false by default', async () => {
		// No serverDefault → same as false
		const screen = await render(Probe, { props: { query: '(max-width: 768px)' } });
		await expect.element(screen.getByTestId('matches')).toHaveTextContent('false');
	});
});
