import {
	InternationalizationContext,
	type InternationalizationContextValue
} from './internationalization-context.svelte.js';

/**
 * Returns an `Intl.Collator` bound to the active provider locale, ported from
 * Astryx's `i18n/useCollator.ts` (new at 0.5.0).
 *
 * It is the sanctioned comparator for user-visible string ordering — a custom
 * `Table` comparator, a sorted filter list. Constructing a raw `Intl.Collator`
 * or calling `String.prototype.localeCompare` bypasses the provider-backed
 * locale contract this exists to hold; upstream keeps raw collator construction
 * centralized here for exactly that reason.
 *
 * Falls back to `'en'` without a provider, matching `useTranslator`,
 * `useDirection` and `useLocale`.
 *
 * ## Three translations, none of them cosmetic
 *
 * **It returns a getter, not the collator.** The reason `useLocale` and
 * `useDirection` return getters: Svelte reads context once at initialisation,
 * so handing back the collator itself would freeze every consumer at the locale
 * the provider held on mount — and upstream's last case asserts precisely that
 * a locale swap yields a *different* collator.
 *
 * **Options arrive as a getter**, per this port's hook convention
 * (`useClipboard`, `useFocusTrap`, `useListFocus`, and a dozen more). Upstream
 * re-runs the whole hook body on every render and so re-reads `options` for
 * free; here the body runs once, and a plain object would pin the collator to
 * whatever options the call site happened to hold at initialisation. The
 * argument stays optional the way upstream's is — `undefined` is a value the
 * getter may return, and `new Intl.Collator(locale, undefined)` is upstream's
 * own no-options call.
 *
 * **`useMemo` is `$derived`.** The memoization is part of the contract rather
 * than an optimisation — the collator exists to be reused across every
 * comparison of a sort — so a bare `() => new Intl.Collator(…)` would construct
 * one per comparison and would not be this hook. The `$derived`-cached-through-
 * a-server-render hazard does not apply: the locale cannot change *during* one
 * server render, so there is no value here that a single render must re-read.
 *
 * The one difference is what counts as "options changed". Upstream's dependency
 * list compares the argument's **identity** between renders, so a call site
 * passing an object literal rebuilds the collator on every render, equal
 * options or not. Here the rebuild is driven by the getter's reactive sources:
 * a getter reading `$state` rebuilds when that state is reassigned — including
 * to an equal-but-distinct object, which is upstream's own trigger — and a
 * getter reading nothing reactive never rebuilds. That is upstream's documented
 * behaviour ("recreated when the provider locale or an option changes") without
 * its per-render waste, and nothing observable through `compare` differs.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const collator = useCollator(() => ({ numeric: true }));
 *   const sorted = $derived([...items].sort((a, b) => collator().compare(a.name, b.name)));
 * </script>
 * ```
 */
export function useCollator(
	options: () => Intl.CollatorOptions | undefined = () => undefined
): () => Intl.Collator {
	const get = InternationalizationContext.getOr((): InternationalizationContextValue => ({
		locale: 'en',
		direction: 'ltr',
		messages: {}
	}));

	const collator = $derived(new Intl.Collator(get().locale, options()));

	return () => collator;
}
