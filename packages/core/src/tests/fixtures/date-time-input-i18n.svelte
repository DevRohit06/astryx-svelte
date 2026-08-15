<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import DateTimeInput from '$lib/components/date-time-input/date-time-input.svelte';

	/**
	 * `<DateTimeInput>` under an `InternationalizationProvider`, the
	 * `field-label-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves upstream's `resolves the invalid date and time announcements from
	 * the i18n catalog`, which wraps the component in a provider to prove the two
	 * live-region strings come from `@astryx.dateInput.invalidDate` and
	 * `@astryx.timeInput.invalidTime` rather than being hardcoded English.
	 */
	interface Props extends ComponentProps<typeof DateTimeInput> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...input }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<DateTimeInput {...input} />
</InternationalizationProvider>
