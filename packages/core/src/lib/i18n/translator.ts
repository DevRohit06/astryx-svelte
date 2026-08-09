/**
 * A Translator formats ICU MessageFormat strings for a given locale.
 * Consumers can supply their own to reuse their existing i18n runtime.
 *
 * Consumers who already run an i18n runtime (Paraglide, i18next, typesafe-i18n,
 * …) can inject their own Translator instead of using the default provider. The
 * interface is deliberately small so any real i18n library can satisfy it in a
 * few lines.
 */
export interface Translator {
	/**
	 * Format an ICU MessageFormat message with values in the given locale.
	 */
	format(message: string, values?: Record<string, unknown>, locale?: string): string;
}
