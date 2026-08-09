<script lang="ts" module>
	import type { Component } from 'svelte';

	export interface LinkHarnessProps {
		/** Props spread onto the inner `Link` (href, color, as, onclick, …). */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string | symbol, any>;
		/** Plain text children — the common case. */
		text?: string;
		/** Icon-only children (`<span aria-hidden="true">…</span>`) for the
		 * `label`/`aria-label` cases, mirroring upstream's icon child. */
		icon?: string;
		/** When set, wraps the `Link` in a `LinkProvider` publishing this component. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider?: Component<any>;
	}
</script>

<script lang="ts">
	import Link from '$lib/components/link/link.svelte';
	import LinkProvider from '$lib/components/link/link-provider.svelte';

	/**
	 * Renders a single `Link` with arbitrary props and either text or an icon-only
	 * child, optionally under a `LinkProvider`. Svelte cannot author children
	 * inline in a test the way React's JSX can, so this fixture stands in for the
	 * `<Link>…</Link>` markup every upstream `Link.test.tsx` case writes directly.
	 */
	let { props = {}, text = '', icon, provider }: LinkHarnessProps = $props();
</script>

{#snippet linkBody()}
	<Link {...props}>
		{#if icon}<span aria-hidden="true">{icon}</span>{:else}{text}{/if}
	</Link>
{/snippet}

{#if provider}
	<LinkProvider component={provider}>{@render linkBody()}</LinkProvider>
{:else}
	{@render linkBody()}
{/if}
