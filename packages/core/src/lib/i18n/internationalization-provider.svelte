<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Locale, MessagesByLocale, Overrides } from './types.js';

	export interface InternationalizationProviderProps {
		/**
		 * BCP 47 language tag. Examples: `'en'`, `'pt'`, `'pt-BR'`, `'zh-Hans'`.
		 *
		 * Regional tags are respected — resolving a message walks the tag from
		 * most-specific to least-specific (`pt-BR` → `pt`), then falls back to
		 * the shipped `en` catalog.
		 */
		locale: Locale;
		/**
		 * Additional shipped catalogs to make available for the selected locale.
		 * `en` is bundled with astryx and never needs to be listed here.
		 *
		 * @example
		 * ```svelte
		 * <script lang="ts">
		 *   import fr from '@astryx-svelte/core/locales/fr.json';
		 * <\/script>
		 * <InternationalizationProvider locale="fr" messages={{ fr }}>
		 * ```
		 */
		messages?: MessagesByLocale;
		/**
		 * Sparse per-locale overrides applied on top of shipped defaults.
		 * Only the keys you want to override need to be listed.
		 *
		 * @example
		 * ```svelte
		 * <InternationalizationProvider
		 *   locale="fr"
		 *   overrides={{ fr: { '@astryx.pagination.next': 'Suivant' } }}>
		 * ```
		 */
		overrides?: Overrides;
		/**
		 * Explicit text-direction override. When omitted, direction is derived from
		 * `locale` via `Intl.Locale.getTextInfo()`. Pass it to force a direction —
		 * RTL layout testing under an English catalog, say — or to skip the
		 * derivation when the direction is already known.
		 */
		dir?: 'ltr' | 'rtl';
		children: Snippet;
	}
</script>

<script lang="ts">
	import { getLocaleDirection } from './get-locale-direction.js';
	import { InternationalizationContext } from './internationalization-context.svelte.js';

	/**
	 * Provides locale + additional messages + overrides to all astryx components
	 * in the subtree.
	 *
	 * If a consumer never renders a provider, astryx components still work — they
	 * use the shipped `en` catalog directly.
	 */
	const { locale, messages, overrides, dir, children }: InternationalizationProviderProps =
		$props();

	// Upstream memoises the value object; the getter is the Svelte equivalent and
	// needs no dependency list — it re-reads the props on every consumer read.
	// Direction is resolved *inside* the getter for the same reason: derived once
	// at init it would survive a runtime locale swap, which the docs site does.
	InternationalizationContext.set(() => ({
		locale,
		direction: dir ?? getLocaleDirection(locale),
		messages: messages ?? {},
		overrides
	}));
</script>

{@render children()}
