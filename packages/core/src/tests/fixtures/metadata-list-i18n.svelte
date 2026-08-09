<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import MetadataListHarness from './metadata-list-harness.svelte';

	/**
	 * `metadata-list-harness.svelte` under an `InternationalizationProvider`, the
	 * `timestamp-i18n-probe.svelte` precedent: a provider's `children` is a
	 * snippet and cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the "Show more" / "Show less" toggle reads its
	 * copy from the i18n catalog rather than a hard-coded string.
	 */
	interface Props extends ComponentProps<typeof MetadataListHarness> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...list }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<MetadataListHarness {...list} />
</InternationalizationProvider>
