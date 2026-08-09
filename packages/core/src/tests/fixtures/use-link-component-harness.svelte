<script lang="ts">
	import LinkProvider from '$lib/components/link/link-provider.svelte';
	import type { LinkComponentType } from '$lib/components/link/types.js';
	import Probe from './use-link-component-probe.svelte';
	import Harness from './use-link-component-harness.svelte';

	/**
	 * Wraps the probe in one or two `LinkProvider`s, standing in for the JSX
	 * nesting upstream writes inline. Self-nesting (as the interactive-role
	 * provider does) so the "nested providers — inner overrides outer" case is a
	 * single extra prop.
	 */
	interface Props {
		component: LinkComponentType;
		/** When set, nests a second provider with this component inside the first. */
		innerComponent?: LinkComponentType;
		as?: LinkComponentType;
	}

	const { component, innerComponent, as }: Props = $props();
</script>

{#if innerComponent !== undefined}
	<LinkProvider {component}>
		<Harness component={innerComponent} {as} />
	</LinkProvider>
{:else}
	<LinkProvider {component}>
		<Probe {as} />
	</LinkProvider>
{/if}
