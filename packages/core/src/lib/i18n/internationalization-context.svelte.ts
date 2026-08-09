import { Context } from '../internal/context.js';
import type { Locale, MessagesByLocale, Overrides } from './types.js';

/**
 * Context definition for locale + messages, ported from Astryx's
 * `i18n/InternationalizationContext.ts`.
 *
 * Separated from the provider so components can consume the context without
 * pulling in the provider implementation — upstream's reason, and it holds here
 * for the same reason: 44 of Astryx's 96 units translate, and none of them
 * should drag the provider into their import graph.
 *
 * It stores a **getter**, per the convention `internal/contexts.svelte.ts`
 * explains: Svelte reads context once at init, so a plain value would freeze
 * descendants at whatever locale the provider held on mount.
 */
export interface InternationalizationContextValue {
	locale: Locale;
	/**
	 * Resolved text direction — the provider's explicit `dir` when it has one,
	 * otherwise derived from `locale`. Always resolved here rather than left for
	 * consumers to derive, so a subtree cannot disagree with itself.
	 */
	direction: 'ltr' | 'rtl';
	messages: MessagesByLocale;
	overrides?: Overrides;
}

export const InternationalizationContext = new Context<() => InternationalizationContextValue>(
	'astryx.internationalization'
);
