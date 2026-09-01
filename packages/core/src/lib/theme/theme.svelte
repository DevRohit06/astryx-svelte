<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { DefinedTheme } from './define-theme.js';
	import type { ThemeMode } from './types.js';

	/**
	 * Deliberately unexported, as upstream's `interface ThemeProps` is: `Theme.tsx`
	 * declares it module-privately and `theme/index.ts` publishes no props type for
	 * it. The same standing `SyntaxThemeProps` has.
	 */
	interface ThemeProps {
		/** Theme from `defineTheme()`. */
		theme: DefinedTheme;
		/** Colour mode — `'system'` follows the OS preference. */
		mode?: ThemeMode;
		/** Children to render. */
		children: Snippet;
	}

	// The registry is module-level bookkeeping, not state: nothing renders from
	// it, it only stops a second `<Theme>` re-injecting a stylesheet. `SvelteMap`
	// would add signal bookkeeping for no reader — the same call
	// `theme-mode.svelte.ts` makes for its listener set. (The matching "don't
	// re-log the hint" bookkeeping is `warnOnce`'s own key set.)

	/**
	 * How many mounted `<Theme>`s are using each injected stylesheet, keyed by
	 * theme name, alongside the tag itself.
	 *
	 * **A refcount, where upstream keeps a presence `Set` — an upstream bug
	 * documented rather than replicated.** Upstream's second `<Theme>` with the
	 * same theme name returns *before* it constructs a cleanup, so when the
	 * first one unmounts it removes the shared `<style>` and deletes the key,
	 * and the survivor is left unstyled with nothing to re-inject it. Counting
	 * costs one map entry and removes the failure.
	 */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const injectedThemes = new Map<string, { styles: HTMLStyleElement[]; count: number }>();

	/**
	 * How many injected themes are relying on the `--color-data-*` defaults.
	 *
	 * The defaults are one document-wide `:root` block shared by every theme, not
	 * a per-theme stylesheet, so they get their own count: injected once, and
	 * removed only when the last theme holding a reference goes away. Tearing
	 * them down with whichever `<Theme>` happened to inject them would strip the
	 * palette from the themes still mounted. Upstream's `Theme.tsx` keeps exactly
	 * this counter beside its `injectedThemes` set.
	 */
	let dataTokenDefaultsRefCount = 0;
	let dataTokenDefaultsStyle: HTMLStyleElement | null = null;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { NAMESPACE, dataAttr } from '../internal/naming.js';
	import { warnOnce } from '../utils/dev-warning.js';
	import { generateDataTokenDefaultsCSS, generateThemeCSS } from './generate-theme-rules.js';
	import { isNestedTheme, markThemeNested, setThemeContext } from './theme-context.js';
	import { registerTheme } from './theme-registry.js';
	import { themeWrapperAttrs } from './theme.stylex.js';

	/**
	 * Applies a theme's tokens and sets the `color-scheme` that makes
	 * `light-dark()` resolve.
	 *
	 * Everything a theme does is CSS: token overrides are custom properties on
	 * `[data-astryx-theme]`, and component overrides are `@scope`d rules on the
	 * stable `.astryx-*` selector surface. The component's whole job is to put
	 * that attribute — and a `color-scheme` — on a `display: contents` wrapper,
	 * and to make sure the stylesheet exists.
	 *
	 * **Root detection.** The first `<Theme>` in the tree (the one with no
	 * `<Theme>` above it) also mirrors two attributes onto
	 * `document.documentElement`:
	 *
	 * - `data-theme` — `base.css` maps it to `color-scheme`, so browser chrome
	 *   (scrollbars, native controls, date pickers) follows the app's mode.
	 * - `data-astryx-theme` — lets the `@scope`d theme CSS reach elements
	 *   rendered outside the wrapper: the top layer, and `useToast`'s detached
	 *   fallback viewport.
	 *
	 * Nested instances skip the sync and theme their subtree only.
	 *
	 * For SSR, set `data-theme` on `<html>` in the root layout so there is no
	 * flash of the wrong mode before hydration:
	 *
	 * ```html
	 * <html lang="en" data-theme="dark">
	 * ```
	 *
	 * @example
	 * ```svelte
	 * <script lang="ts">
	 *   import { Theme } from '@astryx-svelte/core';
	 *   import { neutralTheme } from '@astryx-svelte/theme-neutral';
	 * <\/script>
	 *
	 * <Theme theme={neutralTheme} mode="dark">
	 *   {@render children()}
	 * </Theme>
	 * ```
	 */
	const { theme, mode = 'system', children }: ThemeProps = $props();

	// Read before providing, so this reports whether a *parent* Theme exists —
	// Svelte's context map includes a component's own writes.
	const isNested = isNestedTheme();
	markThemeNested();
	setThemeContext(() => ({ theme, mode }));

	// Makes the theme resolvable by *name*, which is what a consumer outside the
	// component tree has to go on. Upstream's, and what it put in place of the
	// `registerIcons(theme.icons)` call described below: a name → theme entry
	// rather than a document-wide icon map. Idempotent, and keyed by name, so
	// nested `<Theme>`s cannot clobber each other's glyphs the way that did.
	//
	// Twice, because upstream's single call sits in the render body and React
	// re-runs that on a `theme` prop change: the init call is the one that runs
	// during SSR, the effect is the one that follows a swapped theme. Every theme
	// built by `defineTheme` is registered at import time anyway — this is for a
	// `DefinedTheme` assembled some other way. `untrack` says the init read is
	// deliberately the mount-time one, which is what the effect below exists to
	// cover.
	untrack(() => registerTheme(theme));
	$effect.pre(() => {
		registerTheme(theme);
	});

	// Marks the injected `<style>` this instance owns, as upstream's `useId` does.
	const uid = $props.id();

	// **A theme no longer registers its icons globally, as of upstream 0.3.0.**
	//
	// This block used to call `registerIcons(theme.icons)` at init and again from
	// an `$effect.pre`. Upstream did the same from its render body and deleted it
	// at 0.3.0, and deleting it here is required rather than tidy — the global
	// write was wrong in three ways:
	//
	// - **Nested themes clobbered each other.** The registry is one module-level
	//   map, so an inner `<Theme>` overwrote the outer's glyphs for the whole
	//   document rather than just its own subtree.
	// - **On the server it leaked across requests**, mutating module-global state
	//   per render so one request's theme icons could paint the next request's.
	// - It now trips `registerIcons`' own `warnOnce`, telling every app with a
	//   themed icon map to stop doing what this component was doing for them.
	//
	// `Icon` and `useIcon` resolve the nearest `<Theme>`'s `icons` from context
	// before falling through to the global registry, which is what makes removing
	// this safe — and, unlike upstream, needs no theme-name indirection, because
	// Svelte's `getContext` reads identically during SSR and on the client.

	/**
	 * Injects an unbuilt theme's CSS.
	 *
	 * A built theme (`__built`) ships its stylesheet as a file the consumer
	 * imports, so there is nothing to do. Everything else gets one `<style>` in
	 * `<head>`, once per theme name, removed when the last `<Theme>` using it
	 * goes away.
	 *
	 * Upstream splits the output into a prose half (`@layer reset`, which any
	 * class-based style beats) and a component half (`@layer astryx-theme`, above
	 * StyleX so a theme can restyle a component on purpose), and injects each as
	 * its own `<style>` so the two land in different layers. `generateThemeCSS`
	 * returns those two blocks unwrapped and this decides the layer, which is the
	 * split upstream draws between the generator and its callers.
	 *
	 * The perf hint is upstream's, with the package names substituted: it names
	 * *packages* rather than components, so keeping `@astryxdesign/…` verbatim
	 * would tell a reader to install something that does not exist here. (The
	 * `useToast` strings that *are* kept verbatim name components this port
	 * intends to ship, which is the distinction.) Upstream's own two copies
	 * disagree about the CLI's name — `@astryxdesign/cli` in source, bare
	 * `astryx` in the published 0.1.7 build — and the source wins, as ever.
	 */
	$effect.pre(() => {
		if (theme.__built) return;

		const themeKey = `astryx-theme-${theme.name}`;

		/**
		 * Drops one hold on this theme's stylesheets, and the last one out also
		 * drops the theme's hold on the shared `--color-data-*` block.
		 *
		 * Shared by both branches below rather than written into each, because
		 * the `<Theme>` that injected the tags need not be the one that unmounts
		 * last: a joiner's cleanup can be the one that empties the count, and it
		 * has to release the base block when it is.
		 */
		const release = (entry: { styles: HTMLStyleElement[]; count: number }): void => {
			entry.count -= 1;
			if (entry.count > 0) return;
			for (const style of entry.styles) style.remove();
			injectedThemes.delete(themeKey);
			if (--dataTokenDefaultsRefCount === 0) {
				dataTokenDefaultsStyle?.remove();
				dataTokenDefaultsStyle = null;
			}
		};

		// Already injected by another `<Theme>` on this theme: join its count and
		// register a cleanup, rather than returning without one.
		const existing = injectedThemes.get(themeKey);
		if (existing) {
			existing.count += 1;
			return () => release(existing);
		}

		// One-time perf hint per theme. The import lines and the closing sentence
		// name *our* packages: `@astryx-svelte/theme-*` has no `/built` subpath
		// (upstream's does) and this repo's CLI has no `theme build` command yet,
		// so upstream's wording there would point at things that do not exist.
		warnOnce(
			`theme-injection:${theme.name}`,
			'Theme',
			`"${theme.name}" is using runtime style injection. ` +
				`For better performance, use the pre-built theme:\n\n` +
				`  import {${theme.name}Theme} from '@astryx-svelte/theme-${theme.name}';\n` +
				`  import '@astryx-svelte/theme-${theme.name}/theme.css';\n\n` +
				`For custom themes, build the artifacts ahead of time rather than ` +
				`defining the theme at runtime.`
		);

		const { prose, component } = generateThemeCSS(theme);

		/**
		 * One `<style>` per layer, as upstream. The `theme` / `theme-prose`
		 * markers are how a consumer or a test finds each half; the `id` marker is
		 * upstream's second one, identifying the instance that injected the tag.
		 */
		const inject = (marker: string, layer: string, css: string): HTMLStyleElement => {
			const style = document.createElement('style');
			style.setAttribute(dataAttr(marker), theme.name);
			style.setAttribute(dataAttr('id'), uid);
			style.textContent = `@layer ${layer} {\n${css}\n}`;
			document.head.appendChild(style);
			return style;
		};

		// The `--color-data-*` defaults, in `@layer astryx-base` where StyleX puts
		// the core token defaults, so a theme's own data token outranks them by
		// layer rather than by specificity. One document-wide `:root` block shared
		// by every theme, so it carries no theme name and no `id` marker and is
		// counted separately — see `dataTokenDefaultsRefCount`. Appended, never
		// prepended, so it cannot declare `astryx-base` ahead of `reset`; a
		// consumer that loaded `base.css` has the order pinned there regardless.
		if (dataTokenDefaultsRefCount++ === 0) {
			dataTokenDefaultsStyle = document.createElement('style');
			dataTokenDefaultsStyle.setAttribute(dataAttr('theme-base'), '');
			dataTokenDefaultsStyle.textContent = `@layer ${NAMESPACE}-base {\n${generateDataTokenDefaultsCSS()}\n}`;
			document.head.appendChild(dataTokenDefaultsStyle);
		}

		const styles: HTMLStyleElement[] = [];
		// Prose first, so the reset layer is declared before the theme layer.
		if (prose) styles.push(inject('theme-prose', 'reset', prose));
		if (component) styles.push(inject('theme', `${NAMESPACE}-theme`, component));

		const entry = { styles, count: 1 };
		injectedThemes.set(themeKey, entry);

		return () => release(entry);
	});

	/**
	 * Mirrors the root `<Theme>`'s mode and name onto `<html>`.
	 *
	 * `'system'` *removes* `data-theme` rather than writing it, so `base.css`'s
	 * default (`color-scheme: light dark`) applies and `useThemeMode`'s attribute
	 * read correctly finds nothing to pin it to.
	 *
	 * `$effect.pre` rather than a plain `$effect` for the reason
	 * `useIsomorphicLayoutEffect` exists upstream: the attribute drives
	 * `color-scheme` for the whole document, and a consumer reading it in its own
	 * pre-effect (`useThemeMode`, and through it every `Toast`) must not see a
	 * frame of the previous mode.
	 */
	$effect.pre(() => {
		if (isNested) return;

		const currentMode = mode;
		const themeName = theme.name;

		if (currentMode === 'light' || currentMode === 'dark') {
			document.documentElement.setAttribute('data-theme', currentMode);
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
		document.documentElement.setAttribute(dataAttr('theme'), themeName);

		return () => {
			document.documentElement.removeAttribute('data-theme');
			document.documentElement.removeAttribute(dataAttr('theme'));
		};
	});

	const attrs = $derived(themeWrapperAttrs(mode));
</script>

<div
	{...{
		[dataAttr('theme')]: theme.name,
		'data-theme': mode === 'system' ? undefined : mode
	}}
	class={attrs.class}
	style={attrs.style}
>
	{@render children()}
</div>
