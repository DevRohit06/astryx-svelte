<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import FieldLabel from '$lib/components/field/field-label.svelte';

	/**
	 * `<FieldLabel>` under an `InternationalizationProvider`, the
	 * `button-i18n.svelte` precedent: a provider's `children` is a snippet and
	 * cannot be written inline in a `render()` props object.
	 *
	 * Serves the two cases asserting the optional/required indicators read their
	 * copy from the i18n catalog.
	 */
	interface Props extends ComponentProps<typeof FieldLabel> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...label }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<FieldLabel {...label} />
</InternationalizationProvider>
