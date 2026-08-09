import type { Component } from 'svelte';

/**
 * Ported from Astryx's `Link/types.ts`.
 *
 * A component that can stand in for the native anchor — either a string tag
 * (the default `'a'`) or a Svelte component that accepts at least `href`,
 * `class`, `style` and children. Upstream types this as React's `ElementType`
 * for the same reason: `'a'` the string must be a valid value, not only a
 * component reference. A framework router's link (SvelteKit's enhanced `<a>`, a
 * TanStack link) is supplied through `LinkProvider` or a component's `as` prop.
 */
export type LinkComponentType = string | Component<Record<string, unknown>>;
