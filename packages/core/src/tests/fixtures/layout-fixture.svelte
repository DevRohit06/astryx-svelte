<script lang="ts">
	import Layout from '$lib/components/layout/layout.svelte';
	import type { LayoutProps } from '$lib/components/layout/layout.svelte';
	import AreaProbe from './layout-area-probe.svelte';
	import SlotsProbe from './layout-slots-probe.svelte';

	/**
	 * A `Layout` whose slots hold bare `<div>`s, which is what upstream's cases
	 * pass. A slot named here renders; one left out is genuinely absent, since
	 * every `hasX` in `LayoutSlots` is `slot != null` and an empty snippet is
	 * still a snippet.
	 *
	 * `probeAreas` swaps each slot's text for a probe reporting the area it
	 * landed in, and `probeSlots` puts the slots probe in the content — the two
	 * things upstream's local `AreaProbe`/`SlotsProbe` components do.
	 */
	interface Props extends Omit<LayoutProps, 'header' | 'start' | 'end' | 'footer' | 'content'> {
		header?: string;
		start?: string;
		end?: string;
		footer?: string;
		content?: string;
		/** Rendered as the layout's own children — the `content` shorthand. */
		child?: string;
		probeAreas?: boolean;
		probeSlots?: boolean;
	}

	const {
		header,
		start,
		end,
		footer,
		content,
		child,
		probeAreas = false,
		probeSlots = false,
		...rest
	}: Props = $props();
</script>

{#snippet headerSlot()}
	{#if probeAreas}<AreaProbe testid="h" />{:else}<div>{header}</div>{/if}
{/snippet}

{#snippet startSlot()}
	{#if probeAreas}<AreaProbe testid="s" />{:else}<div>{start}</div>{/if}
{/snippet}

{#snippet endSlot()}
	{#if probeAreas}<AreaProbe testid="e" />{:else}<div>{end}</div>{/if}
{/snippet}

{#snippet footerSlot()}
	{#if probeAreas}<AreaProbe testid="f" />{:else}<div>{footer}</div>{/if}
{/snippet}

{#snippet contentSlot()}
	{#if probeSlots}
		<SlotsProbe />
	{:else if probeAreas}
		<AreaProbe testid="c" />
	{:else}
		<div>{content}</div>
	{/if}
{/snippet}

<Layout
	{...rest}
	header={header != null ? headerSlot : undefined}
	start={start != null ? startSlot : undefined}
	end={end != null ? endSlot : undefined}
	footer={footer != null ? footerSlot : undefined}
	content={content != null || probeSlots ? contentSlot : undefined}
>
	{#if child != null}<div>{child}</div>{/if}
</Layout>
