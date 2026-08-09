<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import AppShellFixture from './app-shell-fixture.svelte';

	/**
	 * `app-shell-fixture.svelte` under an `InternationalizationProvider`, the
	 * `button-i18n.svelte` precedent: a provider's `children` is a snippet and
	 * cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the skip link reads its copy from the i18n
	 * catalog.
	 */
	interface Props extends ComponentProps<typeof AppShellFixture> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...shell }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<AppShellFixture {...shell} />
</InternationalizationProvider>
