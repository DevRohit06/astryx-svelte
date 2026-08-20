<script lang="ts">
	import Theme from '$lib/theme/theme.svelte';
	import Probe from './use-indicator-probe.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';
	import type { IndicatorComponent, IndicatorName } from '$lib/components/indicator/types.js';

	/**
	 * Upstream's `createThemeWrapper(theme)` from `Indicator.test.tsx`: the
	 * `useIndicator` probe inside a `<Theme>`.
	 *
	 * The probe's instance export has to be relayed, because `render(...)`
	 * returns the exports of the component it was handed and the hook has to run
	 * *below* the provider — a `<Theme>` sets its context for descendants, not for
	 * itself.
	 */
	interface Props {
		theme: DefinedTheme;
		name: IndicatorName;
	}

	const { theme, name }: Props = $props();

	let probe = $state<ReturnType<typeof Probe> | undefined>();

	/** `result.current`, relayed from the probe under the provider. */
	export function current(): IndicatorComponent | undefined {
		return probe?.current();
	}
</script>

<Theme {theme}>
	<Probe bind:this={probe} {name} />
</Theme>
