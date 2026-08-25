/**
 * The public i18n surface, matching Astryx's `i18n/index.ts`. It is
 * deliberately small:
 *   - InternationalizationProvider — provider component
 *   - useTranslator                — returns a translator function
 *   - useLocale                    — returns the provider locale
 *   - useCollator                  — provider-bound locale-aware comparison
 *   - useDirection                 — returns the ambient text direction
 *   - getLocaleDirection           — server-safe locale → direction helper
 *   - Translator                   — interface for consumer-injected runtimes
 */

export { default as InternationalizationProvider } from './internationalization-provider.svelte';
export type { InternationalizationProviderProps } from './internationalization-provider.svelte';
export {
	InternationalizationContext,
	type InternationalizationContextValue
} from './internationalization-context.svelte.js';
export { useTranslator, type TranslatorFn } from './use-translator.svelte.js';
export { useLocale } from './use-locale.svelte.js';
export { useCollator } from './use-collator.svelte.js';
export { useDirection } from './use-direction.svelte.js';
export { getLocaleDirection } from './get-locale-direction.js';
export type { Translator } from './translator.js';
export type { Catalog, Locale, MessageEntry, MessagesByLocale, Overrides } from './types.js';
