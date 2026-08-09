<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import Harness from './table-sortable-plugin-fixture.svelte';

	/**
	 * `table-sortable-plugin-fixture.svelte` under an
	 * `InternationalizationProvider`, the `table-row-expansion-i18n.svelte`
	 * precedent: a provider's `children` is a snippet and cannot be written
	 * inline in a `render()` props object.
	 *
	 * Serves upstream's `useTableSortable — i18n` block, whose three cases assert
	 * the header-button aria-labels resolve through the catalog.
	 */
	interface Props extends ComponentProps<typeof Harness> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...harness }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<Harness {...harness} />
</InternationalizationProvider>
