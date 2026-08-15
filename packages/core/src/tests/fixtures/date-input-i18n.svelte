<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import DateInput from '$lib/components/date-input/date-input.svelte';

	/**
	 * `<DateInput>` under an `InternationalizationProvider`, the
	 * `field-label-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the invalid-date live region reads its copy
	 * from the i18n catalog.
	 */
	interface Props extends ComponentProps<typeof DateInput> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...dateInput }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<DateInput {...dateInput} />
</InternationalizationProvider>
