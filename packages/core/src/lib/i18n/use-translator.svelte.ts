import {
	InternationalizationContext,
	type InternationalizationContextValue
} from './internationalization-context.svelte.js';
import { resolve } from './resolve.js';

export type TranslatorFn = (key: string, values?: Record<string, unknown>) => string;

/**
 * Returns a translator function bound to the current provider's locale.
 *
 * Call it during component initialisation, as with every `use*()` here, then
 * call the returned function wherever you need a string — including inside
 * `$derived` and event handlers.
 *
 * Where upstream's `useCallback` is re-created when the context value changes,
 * this reads the context getter at *call* time. A call inside `$derived`
 * therefore re-runs when the provider's locale changes, which is the same
 * observable behaviour with no memo to invalidate.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const t = useTranslator();
 *   const label = $derived(t('@astryx.pagination.goToPage', { page }));
 * </script>
 * ```
 */
export function useTranslator(): TranslatorFn {
	// No provider — fall through to the shipped `en` catalog in `resolve()`, which
	// is what upstream's `createContext` default value does.
	const get = InternationalizationContext.getOr((): InternationalizationContextValue => ({
		locale: 'en',
		direction: 'ltr',
		messages: {}
	}));

	return (key, values) => {
		const ctx = get();
		return resolve(key, values, ctx.locale, ctx.messages, ctx.overrides);
	};
}
