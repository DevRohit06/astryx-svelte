<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import KeyboardHintProbe from './keyboard-hint-probe.svelte';

	/**
	 * `keyboard-hint-probe.svelte` under an `InternationalizationProvider`, the
	 * `metadata-list-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the hint's trailing label reads its copy from
	 * the i18n catalog.
	 */
	interface Props extends ComponentProps<typeof KeyboardHintProbe> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...probe }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<KeyboardHintProbe {...probe} />
</InternationalizationProvider>
