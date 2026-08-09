import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { resetThemes } from '$lib/theme/theme-registry.js';
import { resolveThemeTokens } from '$lib/theme/tokens.js';
import Probe from './fixtures/use-theme-probe.svelte';

/**
 * Ported from Astryx's `theme/useTheme.test.tsx` — 18 of its 19 `it` cases.
 *
 * **Dropped, named:** `resolves derived accent tokens to raw values, not
 * var()/color-mix` builds its theme with `defineTheme({color: {accent}})`, the
 * HCT-generative `color` field this port deliberately does not implement (TODO
 * Phase 3, "deferred without loss"). There is no theme shape to write the case
 * against; restore it with that field. Note the *resolver* half it exercises —
 * `var()` substitution and `color-mix` evaluation — is ported in full and is
 * what the "same resolution as `resolveThemeTokens`" case compares against.
 *
 * ## Project
 *
 * Client (Chromium). The last two describes turn on a real `MutationObserver`
 * on `document.documentElement` and on effect teardown at unmount.
 *
 * ## Translations, none of them a case
 *
 * `renderHook` becomes the probe fixture pair — `use-theme-values.svelte` runs
 * the hook at init (where a context-reading hook must run) and renders what it
 * returns; `use-theme-probe.svelte` is upstream's `wrapper`, adding the
 * `<Theme>` or not. `result.current.tokens` is read back as JSON.
 *
 * Upstream mocks the `useMediaQuery` *module* to a constant `false`; a Svelte
 * module mock cannot reach a hook already imported by the component graph, so
 * `matchMedia` itself is stubbed instead — the same substitution
 * `media-query.svelte.test.ts` makes, and it pins the same thing (light is the
 * OS preference unless a case says otherwise).
 *
 * `act()` disappears — a `$state` write flushes on its own and `expect.element`
 * retries until it has.
 */

const testTheme = defineTheme({
	name: 'test',
	tokens: {
		'--color-accent': ['#AA0000', '#FF5555'],
		'--spacing-4': '20px'
	}
});

const TOKENS = [
	'--color-accent',
	'--color-text-primary',
	'--spacing-1',
	'--spacing-4',
	'--nonexistent'
];

function stubPrefersDark(prefersDark: boolean): void {
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

describe('useTheme', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
	});

	it('returns defaults when used outside Theme', async () => {
		stubPrefersDark(false);
		const screen = await render(Probe, { props: { tokenNames: TOKENS } });

		await expect.element(screen.getByTestId('name')).toHaveTextContent('default');
		// The default light-dark() tokens resolve to their light side, since the
		// stubbed OS preference is light.
		await expect
			.element(screen.getByTestId('token:--color-text-primary'))
			.toHaveTextContent('#0A1317');
		await expect.element(screen.getByTestId('token:--spacing-1')).toHaveTextContent('4px');
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('light');
	});

	it('returns the theme name', async () => {
		const screen = await render(Probe, { props: { theme: testTheme, mode: 'light' } });
		await expect.element(screen.getByTestId('name')).toHaveTextContent('test');
	});

	it('resolves tuple tokens to light values in light mode', async () => {
		const screen = await render(Probe, {
			props: { theme: testTheme, mode: 'light', tokenNames: TOKENS }
		});
		await expect.element(screen.getByTestId('token:--color-accent')).toHaveTextContent('#AA0000');
	});

	it('resolves tuple tokens to dark values in dark mode', async () => {
		const screen = await render(Probe, {
			props: { theme: testTheme, mode: 'dark', tokenNames: TOKENS }
		});
		await expect.element(screen.getByTestId('token:--color-accent')).toHaveTextContent('#FF5555');
	});

	it('resolves single-value tokens unchanged', async () => {
		const screen = await render(Probe, {
			props: { theme: testTheme, mode: 'light', tokenNames: TOKENS }
		});
		await expect.element(screen.getByTestId('token:--spacing-4')).toHaveTextContent('20px');
	});

	it('falls back to defaults for tokens not in theme', async () => {
		const screen = await render(Probe, {
			props: { theme: testTheme, mode: 'light', tokenNames: TOKENS }
		});
		// --spacing-1 is not overridden — it must be the default '4px'.
		await expect.element(screen.getByTestId('token:--spacing-1')).toHaveTextContent('4px');
	});

	it('resolves default light-dark() string tokens for the mode', async () => {
		const screen = await render(Probe, {
			props: { theme: testTheme, mode: 'dark', tokenNames: TOKENS }
		});
		// --color-text-primary defaults to light-dark(#0A1317, #DFE2E5).
		await expect
			.element(screen.getByTestId('token:--color-text-primary'))
			.toHaveTextContent('#DFE2E5');
	});

	it('returns empty string for unknown tokens', async () => {
		const screen = await render(Probe, {
			props: { theme: testTheme, mode: 'light', tokenNames: TOKENS }
		});
		expect(screen.getByTestId('token:--nonexistent').element().textContent).toBe('');
	});

	it('exposes mode reflecting effective mode', async () => {
		const screen = await render(Probe, { props: { theme: testTheme, mode: 'dark' } });
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('dark');
	});

	it('provides a tokens map with all resolved values', async () => {
		const screen = await render(Probe, { props: { theme: testTheme, mode: 'light' } });
		await expect.element(screen.getByTestId('tokens')).toBeInTheDocument();

		const tokens = JSON.parse(screen.getByTestId('tokens').element().textContent ?? '{}');
		expect(tokens['--color-accent']).toBe('#AA0000');
		expect(tokens['--spacing-4']).toBe('20px');
		expect(tokens['--spacing-1']).toBe('4px');
	});

	it('uses the same token resolution as resolveThemeTokens', async () => {
		const screen = await render(Probe, { props: { theme: testTheme, mode: 'dark' } });
		await expect.element(screen.getByTestId('tokens')).toBeInTheDocument();

		const tokens = JSON.parse(screen.getByTestId('tokens').element().textContent ?? '{}');
		expect(tokens).toEqual(resolveThemeTokens(testTheme, { mode: 'dark' }));
	});
});

// Covers the fallback a component takes when it calls useTheme() with no
// ThemeContext ancestor reachable — a detached tree (useToast's fallback
// viewport, other roots appended straight to document.body). A root <Theme>
// syncs its mode to <html data-theme> and its name to <html data-astryx-theme>
// precisely so this resolves the app's actual mode and theme rather than
// jumping to OS preference and the bare token defaults.
//
// Upstream keeps this describe's name from when it only covered the mode half;
// its last two cases are the theme half, added with the registry fallback.
describe('useTheme mode resolution without a ThemeContext ancestor', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		resetThemes();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
	});

	it('resolves mode from <html data-theme> when set', async () => {
		stubPrefersDark(false);
		document.documentElement.setAttribute('data-theme', 'dark');

		const screen = await render(Probe, { props: {} });
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('dark');
	});

	it('falls back to OS preference when <html data-theme> is absent', async () => {
		stubPrefersDark(false);
		const screen = await render(Probe, { props: {} });
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('light');
	});

	it('stays live when <html data-theme> changes after mount', async () => {
		stubPrefersDark(false);
		const screen = await render(Probe, { props: {} });
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('light');

		document.documentElement.setAttribute('data-theme', 'dark');
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('dark');
	});

	it('resolves registered theme tokens from <html data-astryx-theme> when set', async () => {
		stubPrefersDark(false);
		// `defineTheme` registers, so the name on the root attribute is enough to
		// reach the theme object with no <Theme> anywhere in the tree.
		defineTheme({
			name: 'root-brand',
			tokens: { '--color-accent': ['#010203', '#AABBCC'] }
		});
		document.documentElement.setAttribute('data-astryx-theme', 'root-brand');
		document.documentElement.setAttribute('data-theme', 'dark');

		const screen = await render(Probe, { props: { tokenNames: ['--color-accent'] } });

		await expect.element(screen.getByTestId('name')).toHaveTextContent('root-brand');
		// The dark side of the tuple: <html data-theme> is the mode source here,
		// and it outranks the stubbed light OS preference.
		await expect.element(screen.getByTestId('token:--color-accent')).toHaveTextContent('#AABBCC');
	});

	it('stays live when <html data-astryx-theme> changes after mount', async () => {
		stubPrefersDark(false);
		defineTheme({ name: 'first-brand', tokens: { '--color-accent': '#111111' } });
		defineTheme({ name: 'second-brand', tokens: { '--color-accent': '#222222' } });
		document.documentElement.setAttribute('data-astryx-theme', 'first-brand');

		const screen = await render(Probe, { props: { tokenNames: ['--color-accent'] } });
		await expect.element(screen.getByTestId('name')).toHaveTextContent('first-brand');
		await expect.element(screen.getByTestId('token:--color-accent')).toHaveTextContent('#111111');

		document.documentElement.setAttribute('data-astryx-theme', 'second-brand');

		await expect.element(screen.getByTestId('name')).toHaveTextContent('second-brand');
		await expect.element(screen.getByTestId('token:--color-accent')).toHaveTextContent('#222222');
	});
});

// Covers the singleton-per-attribute MutationObservers and the no-context gate:
// a consumer on the provider path must not create an observer or react to the
// root attributes at all, and every no-context consumer shares the same two
// observers, each refcounted down to zero as they unmount.
describe('useTheme root-attribute observer lifecycle', () => {
	afterEach(() => {
		resetThemes();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-astryx-theme');
		vi.unstubAllGlobals();
	});

	it('creates no observer and does not re-render provider-path consumers when <html data-theme> changes', async () => {
		const ObserverSpy = vi.fn();
		vi.stubGlobal('MutationObserver', ObserverSpy);

		const screen = await render(Probe, { props: { theme: testTheme, mode: 'light' } });
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('light');

		expect(ObserverSpy).not.toHaveBeenCalled();

		// Upstream counts renders; a Svelte component has no render counter, so the
		// observable half is asserted directly — the reported mode must not move
		// when the root attribute does, because a provider-path consumer never
		// reads it.
		document.documentElement.setAttribute('data-theme', 'dark');
		await expect.element(screen.getByTestId('mode')).toHaveTextContent('light');
	});

	it('shares one observer across multiple no-context consumers and disconnects once all unmount', async () => {
		const observe = vi.fn();
		const disconnect = vi.fn();
		// A `function`, not an arrow — the hook calls `new MutationObserver(...)`,
		// as upstream's own spy implementation does.
		const ObserverSpy = vi.fn().mockImplementation(function () {
			return { observe, disconnect };
		});
		vi.stubGlobal('MutationObserver', ObserverSpy);

		const first = await render(Probe, { props: {} });
		const second = await render(Probe, { props: {} });

		// Two, not one — and upstream flipped these same numbers from 1 to 2 at
		// v0.3.0 for the same reason. A no-context `useTheme()` now follows both
		// root attributes, and upstream gives each its own refcounted observer
		// rather than one observer with both names in `attributeFilter`: they are
		// separate stores because `useThemeName` subscribes to the name one alone.
		// The *sharing* this case is named for is what stays fixed at two — a
		// second consumer joins both listener sets and creates nothing.
		expect(ObserverSpy).toHaveBeenCalledTimes(2);
		expect(observe).toHaveBeenCalledTimes(2);

		await first.unmount();
		expect(disconnect).not.toHaveBeenCalled();

		await second.unmount();
		expect(disconnect).toHaveBeenCalledTimes(2);
	});
});
