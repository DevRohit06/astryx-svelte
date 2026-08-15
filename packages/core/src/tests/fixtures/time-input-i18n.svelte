<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import TimeInput from '$lib/components/time-input/time-input.svelte';

	/**
	 * `<TimeInput>` under an `InternationalizationProvider`, the
	 * `field-label-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the invalid-time live region reads its copy
	 * from the i18n catalog.
	 */
	interface Props extends ComponentProps<typeof TimeInput> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...timeInput }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<TimeInput {...timeInput} />
</InternationalizationProvider>
