import { Context } from 'runed';
import type { Snippet } from 'svelte';

/**
 * Svelte equivalent of Astryx's `BreadcrumbContext`, declared in
 * `Breadcrumbs.tsx` and — deliberately — *not* re-exported from its `index.ts`,
 * so it stays module-private here too.
 *
 * Stored as a **getter** so an item re-reads a changing `variant`/`separator`.
 * Upstream's `createContext` carries a default value (`'default'` / `'/'`), so a
 * `BreadcrumbItem` rendered outside a `Breadcrumbs` still works; `useBreadcrumb`
 * returns that same default rather than throwing.
 */
/**
 * Extensible variant map for `Breadcrumbs`. Theme packages add custom variants
 * through TypeScript module augmentation, as upstream's does.
 */
export interface BreadcrumbsVariantMap {
	default: true;
	supporting: true;
}

/**
 * - `'default'`: standard text styling
 * - `'supporting'`: smaller, secondary text for supporting context
 */
export type BreadcrumbsVariant = keyof BreadcrumbsVariantMap;

export interface BreadcrumbContextValue {
	variant: BreadcrumbsVariant;
	separator: string | Snippet;
}

const BreadcrumbContext = new Context<() => BreadcrumbContextValue>('astryx.breadcrumbs');

export function setBreadcrumbContext(get: () => BreadcrumbContextValue): void {
	BreadcrumbContext.set(get);
}

/** The enclosing trail's getter, falling back to upstream's context default. */
export function useBreadcrumb(): () => BreadcrumbContextValue {
	return BreadcrumbContext.getOr(() => ({ variant: 'default', separator: '/' }));
}
