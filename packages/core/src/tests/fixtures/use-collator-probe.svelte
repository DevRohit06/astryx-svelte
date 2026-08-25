<script lang="ts">
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale } from '$lib/i18n/types.js';
	import CollatorReadout from './collator-readout.svelte';

	/**
	 * Stand-in for upstream's `renderHook(() => useCollator(options), {wrapper})`
	 * and for the `rerender(…)` its last three cases drive.
	 *
	 * Upstream expresses the no-provider case by omitting `wrapper` entirely.
	 * Here the provider is a real element in the markup, so `hasProvider` selects
	 * between the two branches instead — `use-direction-probe.svelte`'s
	 * arrangement.
	 *
	 * `rerender` has no Svelte counterpart either: a Svelte component is not
	 * re-invoked with new props, its reactive sources change. The three setters
	 * below are those sources, reached through `render(...).component` the way
	 * `clipboard-probe.svelte`'s instance export is.
	 *
	 * `options` is `$state.raw` rather than `$state`: the collator has to rebuild
	 * on a *new object*, and a deep-proxied `$state` would hand the hook a proxy
	 * whose identity no longer tracks the object the case assigned.
	 */
	interface Props {
		hasProvider?: boolean;
		locale?: Locale;
		options?: Intl.CollatorOptions;
		words?: string[];
	}

	const {
		hasProvider = true,
		locale: initialLocale = 'en',
		options: initialOptions,
		words
	}: Props = $props();

	let locale = $state(initialLocale);
	let options = $state.raw(initialOptions);
	let label = $state('a');

	/** Upstream's `rerender` under a provider with a different `locale`. */
	export function setLocale(next: Locale): void {
		locale = next;
	}

	/** Upstream's `rerender({collatorOptions: {…}})` with a fresh object. */
	export function setOptions(next: Intl.CollatorOptions | undefined): void {
		options = next;
	}

	/**
	 * Upstream's `rerender(sameProps)` — a re-render that changes nothing the
	 * collator depends on.
	 */
	export function setLabel(next: string): void {
		label = next;
	}
</script>

{#if hasProvider}
	<InternationalizationProvider {locale}>
		<CollatorReadout options={() => options} {words} {label} />
	</InternationalizationProvider>
{:else}
	<CollatorReadout options={() => options} {words} {label} />
{/if}
