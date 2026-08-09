<script lang="ts">
	import PowerSearchEditPopover from '$lib/components/power-search/power-search-edit-popover.svelte';
	import { useInternalConfig } from '$lib/components/power-search/use-internal-config.svelte.js';
	import type {
		PartialFilter,
		PowerSearchConfig,
		PowerSearchFilter
	} from '$lib/components/power-search/types.js';

	/**
	 * Upstream's `MultiSelectHarness`: `PowerSearchEditPopover` rendered on its
	 * own, with the internal config built from a plain `PowerSearchConfig`.
	 *
	 * `useInternalConfig` must run during a component's init (it is a `$derived`
	 * over a getter), so the one case that renders the popover directly needs a
	 * component to call it in.
	 */
	interface Props {
		config: PowerSearchConfig;
		filter: PartialFilter;
		mode?: 'create' | 'edit';
		onSave: (filter: PowerSearchFilter | null) => void;
		onCancel: () => void;
	}

	const { config, filter, mode = 'edit', onSave, onCancel }: Props = $props();

	const internalConfig = useInternalConfig(() => config);
</script>

<PowerSearchEditPopover config={internalConfig} {filter} {mode} {onSave} {onCancel} />
