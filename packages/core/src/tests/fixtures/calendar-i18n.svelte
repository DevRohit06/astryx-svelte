<script lang="ts">
	import Calendar, { type CalendarProps } from '$lib/components/calendar/calendar.svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale } from '$lib/i18n/types.js';

	/**
	 * `<Calendar>` under an `InternationalizationProvider`, the
	 * `date-input-i18n.svelte` precedent: a provider's `children` is a snippet and
	 * cannot be written inline in a `render()` props object.
	 *
	 * `CalendarProps` is a discriminated union, so the Calendar's own props travel
	 * as one nested object rather than being spread into `Props` — the same shape
	 * `calendar-rtl-fixture.svelte` uses, and for the same reason.
	 *
	 * Serves the two cases that drive stand-alone short weekday names off the
	 * provider locale, one of which re-renders with a different `locale`.
	 */
	interface Props {
		locale: Locale;
		calendar?: CalendarProps;
	}

	const { locale, calendar = {} }: Props = $props();
</script>

<InternationalizationProvider {locale}>
	<Calendar {...calendar} />
</InternationalizationProvider>
