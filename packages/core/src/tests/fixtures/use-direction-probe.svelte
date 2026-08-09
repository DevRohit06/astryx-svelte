<script lang="ts">
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale } from '$lib/i18n/types.js';
	import DirectionReadout from './direction-readout.svelte';

	/**
	 * Stand-in for upstream's `renderHook(() => useDirection(), {wrapper})`.
	 *
	 * Upstream expresses the no-provider case by omitting `wrapper` entirely.
	 * Here the provider is a real element in the markup, so `hasProvider`
	 * selects between the two branches instead — the closest thing to "rendered
	 * without a wrapper" that a Svelte fixture can offer.
	 */
	interface Props {
		hasProvider?: boolean;
		locale?: Locale;
		dir?: 'ltr' | 'rtl';
	}

	const { hasProvider = true, locale = 'en', dir }: Props = $props();
</script>

{#if hasProvider}
	<InternationalizationProvider {locale} {dir}>
		<DirectionReadout />
	</InternationalizationProvider>
{:else}
	<DirectionReadout />
{/if}
