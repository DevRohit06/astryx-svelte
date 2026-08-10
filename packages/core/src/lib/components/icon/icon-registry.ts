import type { Component, Snippet } from 'svelte';
import type { DefinedTheme } from '../../theme/define-theme.js';
import { getRegisteredTheme } from '../../theme/theme-registry.js';
import { warnOnce } from '../../utils/dev-warning.js';
import { defaultIcons } from './default-icons.svelte';
import { bumpIconVersion, readIconVersion } from './icon-registry-signal.svelte.js';

/**
 * The global icon registry, ported from Astryx's
 * `src/Icon/globalIconRegistry.tsx`.
 *
 * Module-level state rather than a context, exactly as upstream: components deep
 * in a tree resolve icons without a provider above them, and the registry is
 * readable during SSR.
 *
 * Since 0.3.0 a lookup may also name a **source** — the theme whose overrides
 * should win over the global ones — which is how two nested `<Theme>`s each
 * render their own glyph instead of the last registration winning for the whole
 * document. `Icon` and `useIcon` pass it; nothing else has to.
 *
 * **Registry entries are snippets, not components.** Upstream stores `ReactNode`
 * — a *rendered* element — which is what lets a theme preset props on the icons
 * it registers (`<X size="1em" aria-hidden />`). A bare component reference
 * cannot carry those, so a snippet is the faithful analogue. Note that `Icon`'s
 * `icon` **prop** is a different type (a component); upstream draws that same
 * distinction between `IconType` and `ReactNode`.
 */

/**
 * Semantic icon names used internally by Astryx components.
 *
 * These represent the functional purpose of each icon, not a specific
 * visual representation. Themes provide the actual icons.
 */
export type IconName =
	| 'close'
	| 'chevronDown'
	| 'chevronLeft'
	| 'chevronRight'
	| 'chevronsLeft'
	| 'chevronsRight'
	| 'check'
	| 'success'
	| 'error'
	| 'warning'
	| 'info'
	| 'calendar'
	| 'clock'
	| 'externalLink'
	| 'menu'
	| 'moreHorizontal'
	| 'search'
	| 'arrowUp'
	| 'arrowDown'
	| 'arrowsUpDown'
	| 'funnel'
	| 'eyeSlash'
	| 'viewColumns'
	| 'copy'
	| 'checkDouble'
	| 'wrench'
	| 'stop'
	| 'microphone';

/**
 * A semantic icon name — either one of the built-in {@link IconName}s or an
 * arbitrary string key contributed by a library or app.
 *
 * The `(string & {})` intersection keeps the built-in names available for
 * autocomplete while still allowing any string, so downstream libraries can
 * register and resolve their own keys (e.g. `'richtext:bold'`) without having
 * to widen the core `IconName` union.
 */
export type ExtendedIconName = IconName | (string & {});

/** Icon registry mapping semantic names to snippets. */
export type IconRegistry = Record<IconName, Snippet>;

/**
 * Where a lookup should read theme-scoped icon overrides from: a `DefinedTheme`
 * object, or the *name* of a theme registered in `theme/theme-registry.ts`.
 */
export type IconRegistrySource = DefinedTheme | string | null | undefined;

/**
 * An icon passed as a component rather than resolved from the registry.
 *
 * Upstream's `IconType`, and worth having by name rather than inlining the
 * shape: ~30 components take an icon prop, and they should all describe it with
 * the same type instead of restating it. Note this is deliberately *not*
 * `IconRegistry`'s value type — the prop takes a component, the registry holds a
 * rendered snippet, which is upstream's split too.
 *
 * ## Why this is a bare `Component`
 *
 * Upstream is `ComponentType<SVGProps<SVGSVGElement>>`, and the literal
 * translation — `Component<SVGAttributes<SVGSVGElement>>` — typechecks against
 * nothing a consumer can actually pass. Component props are contravariant, and
 * the element parameter reaches the event handlers in `DOMAttributes<T>`, so a
 * package declaring `SVGAttributes<SVGElement>` and one declaring
 * `SVGAttributes<SVGSVGElement>` are mutually unassignable. Every real Svelte
 * icon package was measured against the strict form and every one failed:
 * `@fvilers/heroicons-svelte` on the element parameter, `@lucide/svelte`
 * (already this repo's own theme dependency) on a narrowed `name`,
 * `svelte-heros-v2` on a narrowed `focusable`, and `heroicons-svelte` on being
 * Svelte 4 classes rather than Svelte 5 components.
 *
 * The strictness is an artefact of the translation, not of upstream's intent.
 * `@heroicons/react` accepts the *full* `SVGProps<SVGSVGElement>` and only adds
 * optional extras, so upstream's type admits its own icon set; no Svelte icon
 * package is written that way. Keeping the literal form would mean core's
 * published `Icon` accepts no icon library at all — which is what pushed the
 * page templates onto the 28-name semantic registry and the wrong glyphs that
 * implies.
 *
 * A bare `Component` is the same call shadcn-svelte makes for the same reason.
 * `Icon` passes only SVG attributes to whatever it renders, so the shape this
 * name documents is unchanged; what is dropped is the element parameter that
 * no package can satisfy.
 */
export type IconType = Component;

// Keyed by plain `string`, not `IconName`: since 0.3.0 a library may register
// its own extension keys alongside the built-ins.
let globalRegistry: Record<string, Snippet> = {};

/**
 * The icon overrides a lookup's `source` contributes, or `null` when it
 * contributes none.
 *
 * The **name** arm goes through `theme/theme-registry.ts`, the name →
 * `DefinedTheme` map that `defineTheme()` and `<Theme>` populate. Nothing in
 * this package passes a name — `Icon` and `useIcon` read the nearest `<Theme>`
 * off Svelte's context, which, unlike React's, is readable during SSR, so the
 * indirection upstream needs for RSC buys the component path nothing here. It
 * is the seam for a caller with a name and no component tree above it.
 */
function getThemeIconOverrides(source: IconRegistrySource): Partial<IconRegistry> | null {
	if (source == null) {
		return null;
	}

	if (typeof source === 'string') {
		return getRegisteredTheme(source)?.icons ?? null;
	}

	return source.icons ?? null;
}

/**
 * Register icons at the module level. Call once at app initialisation.
 *
 * Icons registered here are available to every component, including
 * server-rendered ones, since nothing has to be read from a context — and, for
 * the same reason, they apply *globally*. Prefer `defineTheme({ icons })` for
 * overrides that should be scoped to one theme; this function warns once to say
 * so, as upstream's does.
 *
 * Any string key is accepted, not just a built-in {@link IconName}, so a library
 * can augment the map with its own and let a theme override them. Resolve those
 * with {@link getExtendedIcon}.
 *
 * @example
 * import { registerIcons } from '@astryx-svelte/core';
 * import { brandIcons } from './brand-icons.svelte';
 * registerIcons(brandIcons);
 *
 * @example
 * // In a library that ships its own icons:
 * registerIcons({ 'richtext:bold': boldGlyph });
 * // resolve with getExtendedIcon('richtext:bold', boldGlyph)
 */
export function registerIcons(icons: Partial<Record<ExtendedIconName, Snippet>>): void {
	warnOnce(
		'icon-registry:global-register-icons',
		'Icon',
		'`registerIcons()` applies icon overrides globally. Prefer `defineTheme({ icons })` for theme-scoped icon overrides.'
	);
	globalRegistry = { ...globalRegistry, ...icons };
	bumpIconVersion();
}

/**
 * A snapshot of the full registry, registered icons overriding built-in
 * defaults, and a `source` theme's icons overriding both. Useful for tooling
 * that needs the same names `Icon` resolves against.
 *
 * Always exactly the built-in {@link IconName} keys: extension keys are
 * resolvable but not enumerable here, which is what keeps `IconRegistry` a
 * closed type.
 */
export function getIconRegistry(source?: IconRegistrySource): Readonly<IconRegistry> {
	readIconVersion();
	const registry = { ...defaultIcons };

	// Iterating the *defaults* rather than the global registry is what keeps
	// extension keys out of the typed snapshot: they are resolved through
	// `getIcon`/`getExtendedIcon`, and `IconRegistry` is the built-in map.
	for (const name of Object.keys(defaultIcons) as IconName[]) {
		registry[name] = globalRegistry[name] ?? defaultIcons[name];
	}

	const themeIcons = getThemeIconOverrides(source);
	if (themeIcons != null) {
		for (const name of Object.keys(themeIcons) as IconName[]) {
			registry[name] = themeIcons[name] ?? registry[name];
		}
	}

	return registry;
}

/**
 * One icon by name: the `source` theme's override, then a global registration,
 * then the built-in default.
 *
 * Accepts extension keys (any string) as well as the built-in
 * {@link IconName}s. For a caller-supplied fallback when a key resolves to
 * nothing, use {@link getExtendedIcon}.
 *
 * The `readIconVersion()` call is the subscription: the registry is a plain
 * module binding, so a later `registerIcons` would otherwise not invalidate the
 * `$derived` in `icon.svelte` and a mounted icon would keep the glyph it had
 * when it mounted. See `icon-registry-signal.svelte.ts`. The `source` half needs
 * no such treatment — a `DefinedTheme` reaches the caller through context, which
 * is a signal already, which is why `useIcon` exists.
 */
export function getIcon(name: ExtendedIconName, source?: IconRegistrySource): Snippet | undefined {
	readIconVersion();
	const themeIcons = getThemeIconOverrides(source);
	return themeIcons?.[name as IconName] ?? globalRegistry[name] ?? defaultIcons[name as IconName];
}

/**
 * An extension icon by an arbitrary string key, falling back to a
 * caller-supplied default when nothing is registered under it.
 *
 * This is the seam a library uses to make its own icons themeable: ship the
 * snippet as `fallback`, resolve through this function, and a theme can override
 * the key via {@link registerIcons} without the library having to widen the core
 * {@link IconName} union.
 *
 * @example
 * // Library default, overridable by a theme registering 'richtext:bold':
 * getExtendedIcon('richtext:bold', boldGlyph)
 */
export function getExtendedIcon(
	name: ExtendedIconName,
	fallback?: Snippet,
	source?: IconRegistrySource
): Snippet | undefined {
	readIconVersion();
	const themeIcons = getThemeIconOverrides(source);
	return (
		themeIcons?.[name as IconName] ??
		globalRegistry[name] ??
		defaultIcons[name as IconName] ??
		fallback
	);
}

/**
 * Reset the global registry. For testing only.
 * @internal
 */
export function resetIcons(): void {
	globalRegistry = {};
	bumpIconVersion();
}
