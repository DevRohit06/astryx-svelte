<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import Button from '$lib/components/button/button.svelte';

	/**
	 * `<Button>` under an `InternationalizationProvider`, the
	 * `metadata-list-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the loading live region reads its copy from
	 * the i18n catalog.
	 */
	interface Props extends ComponentProps<typeof Button> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...button }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<Button {...button} />
</InternationalizationProvider>
