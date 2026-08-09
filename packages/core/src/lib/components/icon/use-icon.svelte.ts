import type { Snippet } from 'svelte';
import { useThemeContext } from '../../theme/theme-context.js';
import { useThemeName } from '../../theme/use-theme.svelte.js';
import { getIcon, type IconName } from './icon-registry.js';

/**
 * Ported from Astryx's `src/Icon/useIcon.ts`.
 *
 * Resolves a semantic icon name against the **nearest `<Theme>`** first, then
 * the global registrations, then the built-in defaults — the lookup `Icon`
 * itself performs, packaged for the ~11 components that render a registry icon
 * directly rather than through `<Icon>`.
 *
 * ## Why a hook rather than a bare `getIcon(name)` call
 *
 * Two reasons, and both are load-bearing here in a way they are not upstream.
 *
 * 1. **Theme scoping.** `getIcon(name)` with no source reads only the global
 *    registry, so nested `<Theme>`s — which each contribute their own `icons` —
 *    cannot disagree. This reads the context, so they can.
 * 2. **Reactivity.** `getIcon` subscribes its caller to `readIconVersion()`, but
 *    only if the caller *is* a reactive scope. `const icon = getIcon('x')` at
 *    component init is not: it runs once, subscribes nothing, and freezes on
 *    whatever the registry held at that moment. This hook does the read inside a
 *    `$derived`, so both halves — a later `registerIcons` and a changed theme —
 *    reach the call site. That is what upstream's `useIcon` buys React, arrived
 *    at from the other direction: React re-runs the component body, so a hook is
 *    the only shape a lookup can take; here the hook is what makes the lookup
 *    re-run.
 *
 * ## Resolving the theme
 *
 * Upstream is `getIcon(name, useThemeName())`, and `useThemeName` has **two**
 * arms: the nearest `<Theme>`'s name, and — with no `<Theme>` above — the name
 * the root `<Theme>` mirrored onto `<html data-astryx-theme>`. The second is
 * what lets a consumer outside the provider subtree (a detached root, a portal,
 * `useToast`'s fallback viewport) still resolve the app's themed glyphs instead
 * of falling through to the built-in defaults. Both arms are here.
 *
 * The *context* arm passes the theme **object** rather than its name, matching
 * `icon.svelte`: Svelte's context is readable during SSR, so the name
 * indirection upstream needs for RSC buys the component path nothing, and
 * routing it through the module-level theme registry would reintroduce two
 * hazards the object does not have — a request-global lookup on the server, and
 * nested `<Theme>`s sharing a name resolving to whichever registered last. The
 * *root-attribute* arm has no object to reach for, so it passes the name and
 * goes through the registry, exactly as upstream's does.
 *
 * `useThemeName` subscribes to no DOM at all on the context path, so the common
 * case — a `useIcon` under a `<Theme>` — still creates no observer.
 *
 * ## Shape
 *
 * Upstream returns a `ReactNode`. The port's registry holds **snippets**, which
 * is the same "already rendered, props preset" thing, so this returns the
 * snippet directly — no hook-plus-layer-component split, because there is no
 * component with state to host. The name comes in as a getter and the snippet
 * goes out on a live object, per the port's hook convention: a plain return
 * value cannot stay live across a component's lifetime.
 *
 * Call during component initialisation, like every context-reading hook here.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useIcon } from '@astryx-svelte/core';
 *   const chevron = useIcon(() => 'chevronDown');
 * </script>
 *
 * {#if chevron.current}{@render chevron.current()}{/if}
 * ```
 */
export interface UseIconReturn {
	/** The resolved icon, or `undefined` when nothing is registered under the name. */
	readonly current: Snippet | undefined;
}

export function useIcon(name: () => IconName): UseIconReturn {
	const themeContext = useThemeContext();
	const themeName = useThemeName();
	const icon = $derived(getIcon(name(), themeContext?.().theme ?? themeName.current));

	return {
		get current(): Snippet | undefined {
			return icon;
		}
	};
}
