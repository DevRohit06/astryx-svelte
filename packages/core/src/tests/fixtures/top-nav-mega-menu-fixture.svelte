<script lang="ts" module>
	import type { TopNavRenderMode } from '$lib/components/top-nav/top-nav-render-context.svelte.js';
</script>

<script lang="ts">
	import TopNavMegaMenu from '$lib/components/top-nav/top-nav-mega-menu.svelte';
	import TopNavMegaMenuItem from '$lib/components/top-nav/top-nav-mega-menu-item.svelte';
	import TopNavRenderScope from '$lib/components/top-nav/top-nav-render-scope.svelte';

	/**
	 * `<TopNavMegaMenu>` with its `items` and `featured` slots described as data,
	 * plus a standalone-item mode for upstream's `TopNavMegaMenuItem` describe.
	 *
	 * `mode` stands in for `<TopNavRenderContext value="drawer">`: the context
	 * object is public on both sides, but React scopes it with an element and
	 * Svelte needs a component boundary, which `TopNavRenderScope` is.
	 */
	interface Props {
		/** Publishes `TopNavRenderContext` above the menu. */
		mode?: TopNavRenderMode;
		/** Props for `<TopNavMegaMenu>` (`label`, rest props). */
		menu?: Record<string, unknown>;
		/** One `<TopNavMegaMenuItem>` per entry, filling the `items` slot. */
		items?: Record<string, unknown>[];
		/** `featured` slot — a `<span>` with this text and optional testid. */
		featured?: { text: string; testid?: string };
		/** A standalone `<TopNavMegaMenuItem>`, rendered with no menu around it. */
		item?: Record<string, unknown>;
	}

	const { mode, menu, items, featured, item }: Props = $props();
</script>

{#snippet itemsSlot()}
	{#each items ?? [] as spec, i (i)}
		<TopNavMegaMenuItem {...spec} title={spec.title as string} />
	{/each}
{/snippet}

{#snippet featuredSlot()}<span data-testid={featured?.testid}>{featured?.text}</span>{/snippet}

{#snippet body()}
	{#if item}
		<TopNavMegaMenuItem {...item} title={item.title as string} />
	{:else if menu}
		<TopNavMegaMenu
			{...menu}
			label={menu.label as string}
			items={items ? itemsSlot : undefined}
			featured={featured ? featuredSlot : undefined}
		/>
	{/if}
{/snippet}

{#if mode}
	<TopNavRenderScope {mode}>{@render body()}</TopNavRenderScope>
{:else}
	{@render body()}
{/if}
