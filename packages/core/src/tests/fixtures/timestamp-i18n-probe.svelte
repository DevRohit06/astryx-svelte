<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Timestamp from '$lib/components/timestamp/timestamp.svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';

	/**
	 * Upstream's
	 * `<InternationalizationProvider locale="fr" overrides={…}><Timestamp …/></InternationalizationProvider>`
	 * as a fixture, because a provider's `children` is a snippet here and cannot
	 * be written inline in a `render()` props object. Serves the one case in
	 * `timestamp.svelte.test.ts` that asserts the copy announcement travels
	 * through the i18n catalog rather than a hard-coded string.
	 */
	interface Props extends ComponentProps<typeof Timestamp> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...timestamp }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<Timestamp {...timestamp} />
</InternationalizationProvider>
