import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Icon from '$lib/components/icon/icon.svelte';
import { registerIcons, resetIcons } from '$lib/components/icon/icon-registry.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { resetThemes } from '$lib/theme/theme-registry.js';
import { glyphs } from './fixtures/use-icon-glyphs.svelte';
import Probe from './fixtures/use-icon-probe.svelte';
import ThemeProbe from './fixtures/use-icon-theme-probe.svelte';

/**
 * **No upstream counterpart, and the bar for that is met here.**
 *
 * Upstream ships no `useIcon.test.ts`. It does not need one: its `useIcon` is
 * four lines — `getIcon(name, useThemeName())` — inside a function React re-runs
 * on every render, so *every* property this file asserts comes for free there.
 * The only theme-resolution case upstream owns lives in `Icon.test.tsx`
 * (`resolves string-mode icons from the nearest Theme without leaking globally`)
 * and is already ported, verbatim, in `icon.svelte.test.ts`.
 *
 * Here the hook is a different object, and it is Svelte's rules that made it
 * one. `const icon = getIcon('check')` at component init runs once, subscribes
 * to nothing and freezes on whatever the registry held at that moment — so the
 * lookup has to happen inside a `$derived`, and the result has to come back on a
 * live object rather than as a value. That reframing is the hazard: three of the
 * cases below (attribute change, `registerIcons` after mount, and the
 * observer-lifecycle one) are asking whether the *subscription* exists, a
 * question React's re-render model means upstream's suite cannot pose and its
 * ported descendants therefore cannot inherit.
 *
 * The remaining cases pin the two resolution arms — nearest `<Theme>` first,
 * then the theme named by `<html data-astryx-theme>`, then the global registry,
 * then the built-in default. The second arm was **missing** until batch 18: a
 * consumer outside the provider subtree (a portal, a detached root, `useToast`'s
 * fallback viewport) silently resolved the built-in glyph instead of the app's
 * themed one. `resolves the theme named by <html data-astryx-theme> ...` and
 * `re-resolves when <html data-astryx-theme> changes ...` are the two that fail
 * against the pre-fix hook; the nested-`<Theme>` case is here to prove the fix
 * did not regress the object arm it sits beside.
 *
 * Mutation-checked: narrowing `use-icon.svelte.ts`'s `$derived` back to
 * `getIcon(name(), themeContext?.().theme)` fails the first two cases and
 * nothing else; doing the same to `icon.svelte`'s `resolved` fails the last one.
 *
 * Client project: the root-attribute arm is a real `MutationObserver` on
 * `document.documentElement`, and the last case counts observers as
 * `use-theme.svelte.test.ts`'s lifecycle describe does.
 */

/** The built-in `check` default is an inline `<svg>`; every test glyph is text. */
function hasBuiltInGlyph(container: HTMLElement, testid: string): boolean {
	return container.querySelector(`[data-testid="${testid}"] svg`) != null;
}

describe('useIcon', () => {
	afterEach(() => {
		resetIcons();
		resetThemes();
		document.documentElement.removeAttribute('data-astryx-theme');
		vi.unstubAllGlobals();
	});

	it('resolves the theme named by <html data-astryx-theme> with no <Theme> in scope', async () => {
		defineTheme({ name: 'use-icon-root', icons: { check: glyphs.root } });
		document.documentElement.setAttribute('data-astryx-theme', 'use-icon-root');

		const screen = await render(Probe);

		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('root-check');
	});

	it('re-resolves when <html data-astryx-theme> changes after mount', async () => {
		defineTheme({ name: 'use-icon-first', icons: { check: glyphs.first } });
		defineTheme({ name: 'use-icon-second', icons: { check: glyphs.second } });
		document.documentElement.setAttribute('data-astryx-theme', 'use-icon-first');

		const screen = await render(Probe);
		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('first-check');

		document.documentElement.setAttribute('data-astryx-theme', 'use-icon-second');

		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('second-check');
	});

	it('prefers the nearest <Theme> over a conflicting root attribute', async () => {
		const scoped = defineTheme({ name: 'use-icon-scoped', icons: { check: glyphs.outer } });
		defineTheme({ name: 'use-icon-other', icons: { check: glyphs.root } });

		const screen = await render(ThemeProbe, { props: { theme: scoped } });
		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('outer-check');

		// A root `<Theme>` mirrors its own name onto `<html>`, so the two only
		// really disagree once the attribute is overwritten from outside. The
		// mirroring effect does not re-run for an external write, so this sticks.
		document.documentElement.setAttribute('data-astryx-theme', 'use-icon-other');
		// A MutationObserver callback is a microtask; one macrotask turn is past
		// the point where a subscribed consumer would have swapped its glyph, so
		// the assertion below is a real "still" rather than a race won by luck.
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(screen.getByTestId('icon-0').element()).toHaveTextContent('outer-check');
	});

	it('gives nested <Theme>s their own glyph', async () => {
		const outer = defineTheme({ name: 'use-icon-outer', icons: { check: glyphs.outer } });
		const inner = defineTheme({ name: 'use-icon-inner', icons: { check: glyphs.inner } });

		const screen = await render(ThemeProbe, { props: { theme: outer, innerTheme: inner } });

		// The context arm passes the theme *object*, so two `<Theme>`s disagree
		// correctly instead of the last-registered name winning for the document.
		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('outer-check');
		await expect.element(screen.getByTestId('inner')).toHaveTextContent('inner-check');
	});

	it('falls through to the global registry and then the built-in default', async () => {
		const bare = await render(Probe);
		// Nothing names a theme and nothing is registered: the built-in `check`.
		expect(hasBuiltInGlyph(bare.container, 'icon-0')).toBe(true);
		await bare.unmount();

		registerIcons({ check: glyphs.global });

		const registered = await render(Probe);
		await expect.element(registered.getByTestId('icon-0')).toHaveTextContent('global-check');
	});

	it('re-resolves a mounted consumer when registerIcons runs later', async () => {
		const screen = await render(Probe);
		expect(hasBuiltInGlyph(screen.container, 'icon-0')).toBe(true);

		// The registry is a plain module binding. Only the version signal
		// `getIcon` reads makes this reach a component that has already mounted —
		// upstream gets it from re-rendering.
		registerIcons({ check: glyphs.global });

		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('global-check');
	});

	it('creates no MutationObserver for consumers under a <Theme>', async () => {
		const ObserverSpy = vi.fn();
		vi.stubGlobal('MutationObserver', ObserverSpy);
		const theme = defineTheme({ name: 'use-icon-observed', icons: { check: glyphs.outer } });

		const screen = await render(ThemeProbe, { props: { theme, count: 4 } });
		await expect.element(screen.getByTestId('icon-3')).toHaveTextContent('outer-check');

		// The root-attribute arm must stay dormant on the context path: `useIcon`
		// is called by ~11 components, so an observer per instance would be an
		// observer per rendered row. `useThemeName`'s `hasCtx` gate is what keeps
		// this at zero.
		expect(ObserverSpy).not.toHaveBeenCalled();
	});

	// `<Icon>` does not call this hook — it inlines the same two-arm resolution,
	// because its name mode has to resolve during the render that emits the
	// `<span>`. So the batch-18 fix landed in two files, and this is the twin.
	// It lives here rather than in `icon.svelte.test.ts` because that file is a
	// case-for-case port of upstream's `Icon.test.tsx` and takes no case upstream
	// does not have; the header above is the justification for this one.
	it('resolves <Icon> string mode through the same root-attribute arm', async () => {
		defineTheme({ name: 'use-icon-icon-root', icons: { check: glyphs.root } });
		document.documentElement.setAttribute('data-astryx-theme', 'use-icon-icon-root');

		const screen = await render(Icon, { props: { icon: 'check', 'data-testid': 'icon-0' } });

		await expect.element(screen.getByTestId('icon-0')).toHaveTextContent('root-check');
	});
});
