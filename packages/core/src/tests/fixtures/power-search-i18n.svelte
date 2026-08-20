<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, MessagesByLocale, Overrides } from '$lib/i18n/types.js';
	import Harness from './power-search-i18n-harness.svelte';

	/**
	 * `power-search-i18n-harness.svelte` under an `InternationalizationProvider`,
	 * the `metadata-list-i18n.svelte` precedent: a provider's `children` is a
	 * snippet and cannot be written inline in a `render()` props object.
	 *
	 * Serves three of the five cases in Astryx's
	 * `i18n/__tests__/e2e-powersearch.test.tsx`; `messages` is forwarded as well
	 * as `overrides` because the pseudo-locale case passes a whole catalog.
	 */
	interface Props extends ComponentProps<typeof Harness> {
		locale: Locale;
		messages?: MessagesByLocale;
		overrides?: Overrides;
	}

	const { locale, messages, overrides, ...harness }: Props = $props();
</script>

<InternationalizationProvider {locale} {messages} {overrides}>
	<Harness {...harness} />
</InternationalizationProvider>
