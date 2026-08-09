import { Context } from 'runed';
import type { LinkComponentType } from './types.js';

/**
 * Svelte equivalent of Astryx's `Link/LinkContext.ts` + `useLinkComponent.ts`.
 *
 * The seam that makes every Astryx link polymorphic: a `LinkProvider` publishes
 * a framework link component (or a custom one), and every `Link`/`Item` reads it
 * so navigation goes through the app's router instead of a full-page `<a>`.
 *
 * As every context here does, it stores a **getter** — the provider's
 * `component` can change — so descendants track it rather than freezing at
 * mount. `setLinkContext` stands in for React's `<LinkContext value>`, and
 * `useLinkComponent()` follows the `useSize()` split: it reads the context once
 * at init and returns a resolver you call with an optional `as` override.
 */
export interface LinkContextValue {
	component: LinkComponentType;
}

const LinkContext = new Context<() => LinkContextValue>('astryx.link');

export function setLinkContext(get: () => LinkContextValue): void {
	LinkContext.set(get);
}

/** The resolved link element plus whether it is the native `<a>`. */
export interface ResolvedLinkComponent {
	component: LinkComponentType;
	/**
	 * True only when the resolved component is the native `'a'` tag. Upstream's
	 * `createLinkWithTo` injects a `to={href}` alias for *every* component except
	 * `'a'` (the React-Router / TanStack compatibility seam); a consumer reads
	 * this to decide whether to add `to`.
	 */
	isNative: boolean;
}

/**
 * Resolves the link component. Priority mirrors upstream: an explicit `as` prop
 * beats the provider, which beats the native `'a'`.
 */
export function useLinkComponent(): (as?: LinkComponentType) => ResolvedLinkComponent {
	const ctx = LinkContext.getOr(null);

	return (as) => {
		const component = as ?? ctx?.().component ?? 'a';
		return { component, isNative: component === 'a' };
	};
}
