<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, MessagesByLocale, Overrides } from '$lib/i18n/types.js';
	import Pagination from '$lib/components/pagination/pagination.svelte';

	/**
	 * `Pagination` under an `InternationalizationProvider`, the
	 * `metadata-list-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves four of the five cases in Astryx's
	 * `i18n/__tests__/e2e-pagination.test.tsx`, which differ only in what they
	 * hand the provider — so `messages` is forwarded here as well as `overrides`,
	 * unlike the other `*-i18n.svelte` fixtures.
	 */
	interface Props extends ComponentProps<typeof Pagination> {
		locale: Locale;
		messages?: MessagesByLocale;
		overrides?: Overrides;
	}

	const { locale, messages, overrides, ...pagination }: Props = $props();
</script>

<InternationalizationProvider {locale} {messages} {overrides}>
	<Pagination {...pagination} />
</InternationalizationProvider>
