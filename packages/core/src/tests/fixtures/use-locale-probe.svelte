<script lang="ts">
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale } from '$lib/i18n/types.js';
	import LocaleReadout from './locale-readout.svelte';

	/**
	 * Stand-in for upstream's `renderHook(() => useLocale(), {wrapper})` and for
	 * the `rerender(…)` its third case drives.
	 *
	 * Upstream expresses the no-provider case by omitting `wrapper` entirely.
	 * Here the provider is a real element in the markup, so `hasProvider` selects
	 * between the two branches instead — `use-direction-probe.svelte`'s
	 * arrangement.
	 *
	 * A Svelte component is not re-invoked with new props, so upstream's
	 * `rerender` becomes a reactive source the case writes to: `setLocale`,
	 * reached through `render(...).component`.
	 */
	interface Props {
		hasProvider?: boolean;
		locale?: Locale;
	}

	const { hasProvider = true, locale: initialLocale = 'en' }: Props = $props();

	let locale = $state(initialLocale);

	/** Upstream's `rerender` under a provider with a different `locale`. */
	export function setLocale(next: Locale): void {
		locale = next;
	}
</script>

{#if hasProvider}
	<InternationalizationProvider {locale}>
		<LocaleReadout />
	</InternationalizationProvider>
{:else}
	<LocaleReadout />
{/if}
