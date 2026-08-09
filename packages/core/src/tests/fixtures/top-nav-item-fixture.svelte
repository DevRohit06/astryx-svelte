<script lang="ts">
	import type { Component } from 'svelte';
	import LinkProvider from '$lib/components/link/link-provider.svelte';
	import TopNavItem from '$lib/components/top-nav/top-nav-item.svelte';

	/**
	 * `<TopNavItem>` with its `icon` and `children` snippets described as data, and
	 * an optional `LinkProvider` around it.
	 *
	 * Upstream writes `icon={<span data-testid="icon">Icon</span>}` and
	 * `<TopNavItem label="…">Custom content</TopNavItem>` inline, and wraps the item
	 * in `<LinkProvider component={CustomLink}>`. All three are template-only
	 * constructs in Svelte, so they come in as props here.
	 */
	interface Props {
		/** Props for `<TopNavItem>` itself. */
		props: Record<string, unknown>;
		/** `icon` slot — a `<span>` with this text and optional testid. */
		icon?: { text: string; testid?: string };
		/** `children` slot — rendered instead of the visible label. */
		body?: string;
		/** When set, wraps the item in a `LinkProvider` publishing this component. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider?: Component<any>;
	}

	const { props, icon, body, provider }: Props = $props();
</script>

{#snippet iconSlot()}<span data-testid={icon?.testid}>{icon?.text}</span>{/snippet}

{#snippet bodySlot()}{body}{/snippet}

{#snippet item()}
	<TopNavItem
		{...props}
		label={props.label as string}
		icon={icon ? iconSlot : undefined}
		children={body !== undefined ? bodySlot : undefined}
	/>
{/snippet}

{#if provider}
	<LinkProvider component={provider}>{@render item()}</LinkProvider>
{:else}
	{@render item()}
{/if}
