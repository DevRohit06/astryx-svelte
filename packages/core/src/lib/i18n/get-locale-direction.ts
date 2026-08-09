/**
 * Server-safe locale → text-direction helper, ported from Astryx's
 * `i18n/getLocaleDirection.ts`.
 *
 * **Deliberately a plain `.ts` module, not `.svelte.ts`.** Upstream markets this
 * as callable from a React Server Component to set `<html dir>`; the Svelte
 * counterpart is a `+layout.server.ts` or `handle` hook, and those load through
 * the plain Node resolver with no Svelte compiler in the pipeline. A rune here —
 * or merely the `.svelte.ts` extension — would make it unimportable from exactly
 * the place it exists to serve. It reads no context and holds no state, so there
 * is nothing to make reactive.
 *
 * `Intl.Locale.getTextInfo()` is CLDR-backed, so the RTL script list is the
 * platform's rather than a hand-maintained array here.
 */
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
	try {
		const loc = new Intl.Locale(locale);
		// Older engines expose the accessor form `.textInfo` instead of the
		// `getTextInfo()` method. Upstream keeps both branches for defensive
		// parity even though its React 19 baseline covers the method everywhere,
		// and the cast is what its `@ts-expect-error` is doing — TypeScript's lib
		// declares only one of the two.
		const withTextInfo = loc as Intl.Locale & {
			getTextInfo?: () => { direction?: string };
			textInfo?: { direction?: string };
		};
		const info =
			typeof withTextInfo.getTextInfo === 'function'
				? withTextInfo.getTextInfo()
				: withTextInfo.textInfo;
		return info?.direction === 'rtl' ? 'rtl' : 'ltr';
	} catch {
		// A malformed tag throws `RangeError`. Direction is a layout decision, not
		// a validation gate, so it degrades to `ltr` rather than taking the render
		// down.
		return 'ltr';
	}
}
