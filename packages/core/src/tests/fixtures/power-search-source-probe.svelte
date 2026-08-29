<script lang="ts">
	import { useInternalConfig } from '$lib/components/power-search/use-internal-config.svelte.js';
	import { usePowerSearchSource } from '$lib/components/power-search/use-power-search-source.svelte.js';
	import type { PowerSearchConfig, PowerSearchItem } from '$lib/components/power-search/types.js';
	import type { SearchSource } from '$lib/components/typeahead/types.js';

	/**
	 * Stand-in for upstream's
	 * `renderHook(() => usePowerSearchSource(useInternalConfig(config), max))`.
	 *
	 * `usePowerSearchSource` calls `useTranslator()`, which reads Svelte context
	 * and so must run during a component's init — hence a probe rather than a
	 * bare function call. It returns a `SearchSource` (two methods, no markup),
	 * so the probe renders nothing and exposes the source as an instance
	 * `export const`; `render(...).component.result` is `result.current`.
	 *
	 * `useInternalConfig` is called **once**, at init, and the resulting object
	 * is closed over by the getter handed to `usePowerSearchSource`. Calling it
	 * inside that getter instead would build a fresh `$derived` on every read and
	 * defeat `allItems`' cache — the property that makes `search('')` and
	 * `bootstrap()` return the same array.
	 *
	 * No `InternationalizationProvider` wraps it, deliberately: every operator in
	 * the ported suite carries a literal `label`, so `resolveOperatorLabel` never
	 * reaches the catalog. `useTranslator`'s `Context.getOr` fallback is what
	 * makes that work without a provider, and is upstream's `createContext`
	 * default.
	 */
	interface Props {
		config: PowerSearchConfig;
		/**
		 * Uncapped by default so the suite exercises matching and ranking rather
		 * than the typed-result cap, which has its own cases. Upstream's
		 * `createSource` helper defaults the same way.
		 */
		maxTypedResults?: number;
	}

	const { config, maxTypedResults = Number.POSITIVE_INFINITY }: Props = $props();

	const internal = useInternalConfig(() => config);

	// Named `result`, after `renderHook`'s `result.current`.
	export const result: SearchSource<PowerSearchItem> = usePowerSearchSource(
		() => internal,
		() => maxTypedResults
	);
</script>
