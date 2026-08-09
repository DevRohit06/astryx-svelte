<script lang="ts" module>
	import type { TopNavMenuItemData } from '$lib/components/top-nav/top-nav-menu.svelte';
	import type { TopNavRenderMode } from '$lib/components/top-nav/top-nav-render-context.svelte.js';

	/** A `TopNavMenuItemData` whose `icon` snippet is described as data. */
	export interface TopNavMenuItemSpec extends Omit<TopNavMenuItemData, 'icon'> {
		/** When set, the item gets an `icon` snippet rendering this `<span>`. */
		icon?: { text: string; testid?: string };
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import TopNavMenu from '$lib/components/top-nav/top-nav-menu.svelte';
	import TopNavRenderScope from '$lib/components/top-nav/top-nav-render-scope.svelte';

	/**
	 * `<TopNavMenu>` with `items` built from specs.
	 *
	 * `items` is a *data* prop on both sides, but `TopNavMenuItemData.icon` is a
	 * `Snippet` here where upstream's is a `ReactNode` — and a snippet can only be
	 * authored in a template. So the array is rebuilt in the template, where the
	 * one `icon` snippet is in scope. Upstream's cases give at most one item an
	 * icon, so a single shared snippet covers them, as `segmented-control-probe`'s
	 * does.
	 */
	interface Props {
		/** Publishes `TopNavRenderContext` above the menu. */
		mode?: TopNavRenderMode;
		/** Props for `<TopNavMenu>` itself — `label`, `delay`, rest props. */
		props: Record<string, unknown>;
		items: TopNavMenuItemSpec[];
	}

	const { mode, props, items }: Props = $props();

	const iconSpec = $derived(items.find((item) => item.icon)?.icon);

	function toData(iconSnippet: Snippet): TopNavMenuItemData[] {
		return items.map((spec) => ({
			title: spec.title,
			description: spec.description,
			href: spec.href,
			onclick: spec.onclick,
			icon: spec.icon ? iconSnippet : undefined
		}));
	}
</script>

{#snippet menuIcon()}<span data-testid={iconSpec?.testid}>{iconSpec?.text}</span>{/snippet}

{#snippet menu()}
	<TopNavMenu {...props} label={props.label as string} items={toData(menuIcon)} />
{/snippet}

{#if mode}
	<TopNavRenderScope {mode}>{@render menu()}</TopNavRenderScope>
{:else}
	{@render menu()}
{/if}
