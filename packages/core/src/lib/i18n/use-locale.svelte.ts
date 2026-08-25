import {
	InternationalizationContext,
	type InternationalizationContextValue
} from './internationalization-context.svelte.js';
import type { Locale } from './types.js';

/**
 * Reads the active provider locale, ported from Astryx's `i18n/useLocale.ts`
 * (new at 0.5.0).
 *
 * It is the approved way to feed a *pure* formatting helper — `Intl.*`,
 * `formatFilterValue`, a chart formatter — the locale the tree is actually
 * running under. Reading `InternationalizationContext` for just its `locale`
 * field, or reaching for `navigator.language` or a hardcoded literal, bypasses
 * the provider-backed contract this exists to hold.
 *
 * **Returns a getter, not a snapshot**, for the reason `useDirection` does:
 * Svelte reads context once at initialisation, so returning `get().locale`
 * would freeze every consumer at whatever locale the provider held on mount,
 * and a runtime locale swap would leave the formatted dates and numbers behind.
 * Upstream's `use()` re-renders the consumer instead; a getter read inside
 * `$derived` is the same observable behaviour.
 *
 * Falls back to `'en'` without a provider, matching `useTranslator` and
 * `useDirection`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const locale = useLocale();
 *   const formatted = $derived(new Intl.NumberFormat(locale()).format(count));
 * </script>
 * ```
 */
export function useLocale(): () => Locale {
	const get = InternationalizationContext.getOr((): InternationalizationContextValue => ({
		locale: 'en',
		direction: 'ltr',
		messages: {}
	}));

	return () => get().locale;
}
