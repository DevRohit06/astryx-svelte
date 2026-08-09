/**
 * Centralised namespace prefix, ported from Astryx's `src/naming.ts`.
 *
 * The `astryx` prefix is part of several externally observable contracts —
 * `.astryx-button` classes, `data-astryx-*` attributes, `--astryx-*` custom
 * properties, the `astryx-base` / `astryx-theme` layer names — and themes target
 * them directly. Keeping it in one place means a rename is a single edit rather
 * than hundreds of literals.
 *
 * We keep Astryx's prefix rather than inventing our own: theme packages match on
 * `.astryx-button`, so changing it would silently break every theme.
 *
 * Upstream publishes this as the `@astryxdesign/core/naming` subpath so build and
 * CLI tooling can import it without pulling in the runtime; we do the same.
 */

/**
 * The DOM/CSS namespace prefix for all externally-observable surfaces
 * (classes, theme/media data attributes, CSS custom properties).
 */
export const NAMESPACE = 'astryx';

/**
 * Class-name prefix for stable component classes, WITHOUT the trailing dash.
 *
 * Use {@link stableClassName} to build a full class token rather than
 * concatenating this directly.
 */
export const classPrefix = NAMESPACE;

/**
 * data-attribute namespace segment (the part between `data-` and the rest).
 * e.g. `dataAttrNamespace` = 'astryx' -> `data-astryx-theme`.
 */
export const dataAttrNamespace = NAMESPACE;

/**
 * CSS custom-property namespace segment.
 * e.g. `--astryx-card-padding`.
 */
export const cssVarNamespace = NAMESPACE;

/** Stable component class, e.g. `stableClassName('button')` → `astryx-button`. */
export function stableClassName(component: string): string {
	return `${classPrefix}-${component}`;
}

/** Namespaced data attribute, e.g. `dataAttr('theme')` → `data-astryx-theme`. */
export function dataAttr(name: string): `data-${string}` {
	return `data-${dataAttrNamespace}-${name}`;
}

/**
 * Namespaced CSS custom property, e.g. `cssVar('card-padding')` →
 * `--astryx-card-padding`.
 *
 * Not usable inside a `.stylex.ts` module: StyleX evaluates those at compile
 * time and cannot call an imported function, so `container.stylex.ts` writes its
 * `var(--astryx-card-padding, …)` chains as literals by necessity.
 */
export function cssVar(name: string): string {
	return `--${cssVarNamespace}-${name}`;
}
